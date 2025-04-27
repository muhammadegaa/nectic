import { NextResponse } from "next/server"
import Stripe from "stripe"
import { headers } from "next/headers"
import { doc, updateDoc, collection, query, where, getDocs } from "firebase/firestore"
import { db } from "@/lib/firebase-client"
import { sendEmail, emailTemplates } from "@/lib/email-service"

// Initialize Stripe with your secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2023-10-16",
})

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

export async function POST(request: Request) {
  try {
    const body = await request.text()
    const signature = headers().get("stripe-signature") || ""

    let event: Stripe.Event

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret || "")
    } catch (err) {
      console.error(`⚠️ Webhook signature verification failed.`, err)
      return NextResponse.json({ error: "Webhook signature verification failed" }, { status: 400 })
    }

    // Handle the event
    switch (event.type) {
      case "customer.subscription.created":
      case "customer.subscription.updated":
        await handleSubscriptionChange(event.data.object as Stripe.Subscription)
        break
      case "customer.subscription.deleted":
        try {
          const subscription = event.data.object as Stripe.Subscription
          const customer = subscription.customer as string

          // Get customer details from Stripe
          const customerDetails = await stripe.customers.retrieve(customer)
          const customerName = (customerDetails as any).name || "Customer"
          const customerEmail = (customerDetails as any).email

          if (customerEmail) {
            // Send subscription canceled email
            await sendEmail(customerEmail, "Subscription Canceled", emailTemplates.subscriptionCanceled(customerName))
          }
        } catch (error) {
          console.error("Error sending subscription canceled email:", error)
        }
        await handleSubscriptionCanceled(event.data.object as Stripe.Subscription)
        break
      case "invoice.payment_succeeded":
        try {
          const invoice = event.data.object as Stripe.Invoice
          const customer = invoice.customer as string

          // Get customer details from Stripe
          const customerDetails = await stripe.customers.retrieve(customer)
          const customerName = (customerDetails as any).name || "Customer"
          const customerEmail = (customerDetails as any).email

          if (customerEmail) {
            // Determine the plan name from the invoice line items
            let planName = "Subscription"
            if (invoice.lines && invoice.lines.data && invoice.lines.data.length > 0) {
              const item = invoice.lines.data[0]
              planName = item.description || "Subscription"
            }

            // Send success email
            await sendEmail(
              customerEmail,
              "Subscription Payment Successful",
              emailTemplates.subscriptionSuccess(customerName, planName),
            )
          }
        } catch (error) {
          console.error("Error sending payment success email:", error)
        }
        await handleInvoicePaymentSucceeded(event.data.object as Stripe.Invoice)
        break
      case "invoice.payment_failed":
        try {
          const invoice = event.data.object as Stripe.Invoice
          const customer = invoice.customer as string

          // Get customer details from Stripe
          const customerDetails = await stripe.customers.retrieve(customer)
          const customerName = (customerDetails as any).name || "Customer"
          const customerEmail = (customerDetails as any).email

          if (customerEmail) {
            // Send payment failed email
            await sendEmail(customerEmail, "Payment Failed", emailTemplates.paymentFailed(customerName))
          }
        } catch (error) {
          console.error("Error sending payment failed email:", error)
        }
        await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice)
        break
      case "invoice.finalized":
        try {
          const invoice = event.data.object as Stripe.Invoice
          const customer = invoice.customer as string

          // Get customer details from Stripe
          const customerDetails = await stripe.customers.retrieve(customer)
          const customerName = (customerDetails as any).name || "Customer"
          const customerEmail = (customerDetails as any).email

          if (customerEmail && invoice.hosted_invoice_url) {
            const amount = new Intl.NumberFormat("en-US", {
              style: "currency",
              currency: invoice.currency.toUpperCase(),
            }).format(invoice.amount_due / 100)

            const dueDate = new Date(invoice.due_date * 1000).toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })

            // Send invoice finalized email
            await sendEmail(
              customerEmail,
              `Invoice #${invoice.number}`,
              emailTemplates.invoiceFinalized(
                customerName,
                invoice.number || "Unknown",
                amount,
                dueDate,
                invoice.hosted_invoice_url,
              ),
            )
          }
        } catch (error) {
          console.error("Error sending invoice finalized email:", error)
        }
        await handleInvoiceFinalized(event.data.object as Stripe.Invoice)
        break
      case "invoice.payment_action_required":
        await handlePaymentActionRequired(event.data.object as Stripe.Invoice)
        break
      case "charge.refunded":
        await handleRefund(event.data.object as Stripe.Charge)
        break
      case "customer.source.expiring":
        await handleCardExpiring(event.data.object as Stripe.Card)
        break
      case "credit_note.created":
        await handleCreditNoteCreated(event.data.object as Stripe.CreditNote)
        break
      case "customer.subscription.trial_will_end":
        await handleTrialEnding(event.data.object as Stripe.Subscription)
        break
      default:
        console.log(`Unhandled event type ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error("Error processing webhook:", error)
    return NextResponse.json({ error: "Error processing webhook" }, { status: 500 })
  }
}

async function handleSubscriptionChange(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string

  try {
    // Find user with this customer ID
    const usersRef = collection(db, "users")
    const q = query(usersRef, where("subscription.stripeCustomerId", "==", customerId))
    const querySnapshot = await getDocs(q)

    if (querySnapshot.empty) {
      console.log(`No user found with customer ID: ${customerId}`)
      return
    }

    // Determine plan tier based on price ID
    let tier = "standard"
    if (subscription.items.data.length > 0) {
      const priceId = subscription.items.data[0].price.id
      if (priceId === process.env.STRIPE_PREMIUM_PRICE_ID) {
        tier = "premium"
      }
    }

    // Update all matching users (should typically be just one)
    for (const docSnapshot of querySnapshot.docs) {
      await updateDoc(doc(db, "users", docSnapshot.id), {
        "subscription.stripeSubscriptionId": subscription.id,
        "subscription.status": subscription.status,
        "subscription.tier": tier,
        "subscription.currentPeriodEnd": new Date(subscription.current_period_end * 1000).toISOString(),
        "subscription.cancelAtPeriodEnd": subscription.cancel_at_period_end,
        "subscription.updatedAt": new Date().toISOString(),
      })
      console.log(`Updated subscription for user: ${docSnapshot.id}`)
    }
  } catch (error) {
    console.error("Error updating user subscription:", error)
  }
}

async function handleSubscriptionCanceled(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string

  try {
    // Find user with this customer ID
    const usersRef = collection(db, "users")
    const q = query(usersRef, where("subscription.stripeCustomerId", "==", customerId))
    const querySnapshot = await getDocs(q)

    if (querySnapshot.empty) {
      console.log(`No user found with customer ID: ${customerId}`)
      return
    }

    // Update all matching users (should typically be just one)
    for (const docSnapshot of querySnapshot.docs) {
      const userData = docSnapshot.data()

      await updateDoc(doc(db, "users", docSnapshot.id), {
        "subscription.status": "canceled",
        "subscription.tier": "free",
        "subscription.canceledAt": new Date().toISOString(),
        "subscription.updatedAt": new Date().toISOString(),
      })

      console.log(`Updated subscription for user: ${docSnapshot.id}`)

      // Send email notification if we have user data
      if (userData.email) {
        await sendEmail(
          userData.email,
          "Your Nectic Subscription Has Been Canceled",
          emailTemplates.subscriptionCanceled(userData.displayName || "there"),
        )
      }
    }
  } catch (error) {
    console.error("Error updating user subscription:", error)
  }
}

async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
  if (!invoice.subscription) return

  try {
    const subscription = await stripe.subscriptions.retrieve(invoice.subscription as string)
    await handleSubscriptionChange(subscription)

    // Send email notification
    if (invoice.customer_email) {
      // Determine plan name
      let planName = "Standard"
      if (subscription.items.data.length > 0) {
        const priceId = subscription.items.data[0].price.id
        if (priceId === process.env.STRIPE_PREMIUM_PRICE_ID) {
          planName = "Premium"
        }
      }

      await sendEmail(
        invoice.customer_email,
        "Your Nectic Subscription is Active!",
        emailTemplates.subscriptionSuccess(invoice.customer_name || "there", planName),
      )
    }
  } catch (error) {
    console.error("Error handling invoice payment succeeded:", error)
  }
}

async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  if (!invoice.subscription) return

  try {
    const subscription = await stripe.subscriptions.retrieve(invoice.subscription as string)
    await handleSubscriptionChange(subscription)

    // Send email notification about failed payment
    if (invoice.customer_email) {
      await sendEmail(
        invoice.customer_email,
        "Action Required: Issue with your Nectic payment",
        emailTemplates.paymentFailed(invoice.customer_name || "there"),
      )
    }
  } catch (error) {
    console.error("Error handling invoice payment failed:", error)
  }
}

async function handleInvoiceFinalized(invoice: Stripe.Invoice) {
  try {
    // Only send email if the invoice is not auto-collected (requires manual payment)
    if (invoice.collection_method === "send_invoice" && invoice.customer_email) {
      const invoiceUrl = invoice.hosted_invoice_url || `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/billing`
      const dueDate = invoice.due_date ? new Date(invoice.due_date * 1000).toLocaleDateString() : "Due upon receipt"
      const amount = formatAmount(invoice.total, invoice.currency)

      await sendEmail(
        invoice.customer_email,
        `Invoice #${invoice.number} from Nectic`,
        emailTemplates.invoiceFinalized(
          invoice.customer_name || "there",
          invoice.number || "N/A",
          amount,
          dueDate,
          invoiceUrl,
        ),
      )
    }
  } catch (error) {
    console.error("Error handling finalized invoice:", error)
  }
}

async function handlePaymentActionRequired(invoice: Stripe.Invoice) {
  try {
    if (invoice.customer_email && invoice.hosted_invoice_url) {
      const amount = formatAmount(invoice.total, invoice.currency)

      await sendEmail(
        invoice.customer_email,
        "Action Required: Confirm Your Payment",
        emailTemplates.authenticationRequired(invoice.customer_name || "there", amount, invoice.hosted_invoice_url),
      )
    }
  } catch (error) {
    console.error("Error handling payment action required:", error)
  }
}

async function handleRefund(charge: Stripe.Charge) {
  if (!charge.customer) return

  try {
    // Find user with this customer ID
    const usersRef = collection(db, "users")
    const q = query(usersRef, where("subscription.stripeCustomerId", "==", charge.customer))
    const querySnapshot = await getDocs(q)

    if (querySnapshot.empty) {
      console.log(`No user found with customer ID: ${charge.customer}`)
      return
    }

    // Get customer details from Stripe
    const customer = await stripe.customers.retrieve(charge.customer as string)

    // Send refund confirmation email
    if (typeof customer !== "string" && (customer as any).email) {
      await sendEmail(
        (customer as any).email,
        "Your Nectic Refund Has Been Processed",
        emailTemplates.refundConfirmation((customer as any).name || "there"),
      )
    }
  } catch (error) {
    console.error("Error handling refund:", error)
  }
}

async function handleCardExpiring(card: Stripe.Card) {
  try {
    if (!card.customer) return

    // Get customer details
    const customer = await stripe.customers.retrieve(card.customer as string)

    if (typeof customer !== "string" && (customer as any).email) {
      await sendEmail(
        (customer as any).email,
        "Your Payment Card is Expiring Soon",
        emailTemplates.cardExpiring((customer as any).name || "there", card.last4 || "****"),
      )
    }
  } catch (error) {
    console.error("Error handling card expiring:", error)
  }
}

async function handleCreditNoteCreated(creditNote: Stripe.CreditNote) {
  try {
    // Get the invoice to find customer details
    const invoice = await stripe.invoices.retrieve(creditNote.invoice as string)

    if (invoice.customer_email) {
      const amount = formatAmount(creditNote.total, creditNote.currency)

      await sendEmail(
        invoice.customer_email,
        `Credit Note #${creditNote.number} Issued`,
        emailTemplates.creditNoteIssued(invoice.customer_name || "there", creditNote.number || "N/A", amount),
      )
    }
  } catch (error) {
    console.error("Error handling credit note created:", error)
  }
}

async function handleTrialEnding(subscription: Stripe.Subscription) {
  try {
    const customerId = subscription.customer as string

    // Get customer details
    const customer = await stripe.customers.retrieve(customerId)

    if (typeof customer !== "string" && (customer as any).email) {
      // Calculate days left in trial
      const trialEnd = subscription.trial_end
      if (!trialEnd) return

      const now = Math.floor(Date.now() / 1000)
      const daysLeft = Math.ceil((trialEnd - now) / (60 * 60 * 24))

      // Determine plan name
      let planName = "Standard"
      if (subscription.items.data.length > 0) {
        const priceId = subscription.items.data[0].price.id
        if (priceId === process.env.STRIPE_PREMIUM_PRICE_ID) {
          planName = "Premium"
        }
      }

      await sendEmail(
        (customer as any).email,
        `Your Nectic ${planName} Trial Ends in ${daysLeft} Days`,
        emailTemplates.trialEnding((customer as any).name || "there", daysLeft, planName),
      )
    }
  } catch (error) {
    console.error("Error handling trial ending:", error)
  }
}

// Helper function to format currency amounts
function formatAmount(amount: number, currency: string): string {
  const formatter = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase() || "USD",
  })

  return formatter.format(amount / 100) // Stripe amounts are in cents
}
