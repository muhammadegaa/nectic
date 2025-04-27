import nodemailer from "nodemailer"
import Stripe from "stripe"

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2023-10-16",
})

// Email configuration
const emailUser = process.env.EMAIL_USER
const emailPass = process.env.EMAIL_PASSWORD || process.env.EMAIL_PASS_ALT
const fromEmail = process.env.FROM_EMAIL || emailUser

// Email template types that correspond to Stripe events
export const emailTemplateTypes = {
  PAYMENT_FAILED: "payment_failed",
  SUBSCRIPTION_TRIAL_ENDING: "subscription_trial_ending",
  CARD_EXPIRING_SOON: "card_expiring_soon",
  INVOICE_FINALIZED: "invoice_finalized",
  REFUND_PROCESSED: "refund_processed",
  PAYMENT_REQUIRES_ACTION: "payment_requires_action",
  SUBSCRIPTION_CREATED: "subscription_created",
  SUBSCRIPTION_CANCELED: "subscription_canceled",
  UPCOMING_INVOICE: "upcoming_invoice",
}

// Function to send emails
export async function sendEmail(to: string, subject: string, html: string) {
  "use server"

  if (!emailUser || !emailPass) {
    console.warn("Email environment variables are not set. Cannot send email.")
    return
  }

  try {
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      auth: {
        user: emailUser,
        pass: emailPass,
      },
    })

    const mailOptions = {
      from: fromEmail,
      to,
      subject,
      html,
    }

    await transporter.sendMail(mailOptions)
    console.log(`Sent email to ${to} with subject: ${subject}`)
  } catch (error) {
    console.error("Error sending email:", error)
    throw error
  }
}

// Email templates
export const emailTemplates = {
  subscriptionSuccess: (name: string, planName: string) => `
    <p>Hi ${name},</p>
    <p>Your Nectic ${planName} subscription is now active!</p>
    <p>Thank you for joining us.</p>
  `,
  paymentFailed: (name: string) => `
    <p>Hi ${name},</p>
    <p>Your payment failed. Please update your payment information.</p>
  `,
  subscriptionCanceled: (name: string) => `
    <p>Hi ${name},</p>
    <p>Your Nectic subscription has been canceled.</p>
  `,
  invoiceFinalized: (name: string, invoiceNumber: string, amount: string, dueDate: string, invoiceUrl: string) => `
    <p>Hi ${name},</p>
    <p>Your invoice #${invoiceNumber} is now available.</p>
    <p>Amount: ${amount}</p>
    <p>Due Date: ${dueDate}</p>
    <p>View your invoice: <a href="${invoiceUrl}">View Invoice</a></p>
  `,
  authenticationRequired: (name: string, amount: string, invoiceUrl: string) => `
    <p>Hi ${name},</p>
    <p>Your payment of ${amount} requires authentication.</p>
    <p>Please authenticate your payment: <a href="${invoiceUrl}">Authenticate Payment</a></p>
  `,
  refundConfirmation: (name: string) => `
    <p>Hi ${name},</p>
    <p>Your refund has been processed.</p>
  `,
  cardExpiring: (name: string, last4: string) => `
    <p>Hi ${name},</p>
    <p>Your card ending in ${last4} is expiring soon. Please update your payment information.</p>
  `,
  creditNoteIssued: (name: string, creditNoteNumber: string, amount: string) => `
    <p>Hi ${name},</p>
    <p>Credit note #${creditNoteNumber} has been issued for ${amount}.</p>
  `,
  trialEnding: (name: string, daysLeft: number, planName: string) => `
    <p>Hi ${name},</p>
    <p>Your Nectic ${planName} trial ends in ${daysLeft} days!</p>
  `,
}

/**
 * Simulates a Stripe event that would trigger an email notification
 * Note: In test mode, Stripe only sends emails to verified domains or team members
 */
export async function simulateStripeEmailEvent(
  email: string,
  eventType: string,
  data: Record<string, any>,
): Promise<{ success: boolean; id?: string; message?: string; error?: string }> {
  try {
    // First, create or retrieve a customer with the provided email
    const customer = await getOrCreateCustomer(email, data.name || "Test Customer")

    // Store the custom price ID if provided
    const customPriceId = data.priceId

    switch (eventType) {
      case emailTemplateTypes.PAYMENT_FAILED:
        return await simulatePaymentFailed(customer.id, customPriceId)

      case emailTemplateTypes.SUBSCRIPTION_TRIAL_ENDING:
        return await simulateTrialEnding(customer.id, customPriceId)

      case emailTemplateTypes.CARD_EXPIRING_SOON:
        return await simulateCardExpiring(customer.id)

      case emailTemplateTypes.INVOICE_FINALIZED:
        return await simulateInvoiceFinalized(customer.id, customPriceId)

      case emailTemplateTypes.REFUND_PROCESSED:
        return await simulateRefund(customer.id)

      case emailTemplateTypes.PAYMENT_REQUIRES_ACTION:
        return await simulatePaymentRequiresAction(customer.id)

      case emailTemplateTypes.SUBSCRIPTION_CREATED:
        return await simulateSubscriptionCreated(customer.id, customPriceId)

      case emailTemplateTypes.SUBSCRIPTION_CANCELED:
        return await simulateSubscriptionCanceled(customer.id, customPriceId)

      case emailTemplateTypes.UPCOMING_INVOICE:
        return await simulateUpcomingInvoice(customer.id, customPriceId)

      default:
        return {
          success: false,
          error: `Unsupported event type: ${eventType}`,
        }
    }
  } catch (error: any) {
    console.error("Error simulating Stripe event:", error)
    return {
      success: false,
      error: error.message || "An error occurred while simulating the Stripe event",
    }
  }
}

/**
 * Get or create a Stripe customer
 */
async function getOrCreateCustomer(email: string, name: string): Promise<Stripe.Customer> {
  // Check if customer already exists
  const customers = await stripe.customers.list({
    email,
    limit: 1,
  })

  if (customers.data.length > 0) {
    return customers.data[0]
  }

  // Create new customer
  return await stripe.customers.create({
    email,
    name,
    metadata: {
      test: "true",
    },
  })
}

/**
 * Create a test price if one is not provided
 */
async function getOrCreateTestPrice(): Promise<string> {
  // Create a temporary product
  const product = await stripe.products.create({
    name: "Temporary Test Product",
    metadata: { test: "true" },
  })

  // Create a temporary price
  const price = await stripe.prices.create({
    product: product.id,
    unit_amount: 1000,
    currency: "usd",
    recurring: { interval: "month" },
    metadata: { test: "true" },
  })

  return price.id
}

/**
 * Get a valid price ID
 */
async function getValidPriceId(customPriceId?: string): Promise<string> {
  // Use the custom price ID if provided
  if (customPriceId) {
    try {
      // Verify the price exists
      await stripe.prices.retrieve(customPriceId)
      return customPriceId
    } catch (error) {
      console.warn(`Custom price ID ${customPriceId} not found. Creating a temporary price.`)
    }
  }

  // Try to use the environment variable
  const envPriceId = process.env.STRIPE_STANDARD_PRICE_ID
  if (envPriceId) {
    try {
      // Verify the price exists
      await stripe.prices.retrieve(envPriceId)
      return envPriceId
    } catch (error) {
      console.warn(`Environment price ID ${envPriceId} not found. Creating a temporary price.`)
    }
  }

  // Create a temporary price if no valid price ID is available
  return await getOrCreateTestPrice()
}

/**
 * Simulate a failed payment
 */
async function simulatePaymentFailed(
  customerId: string,
  customPriceId?: string,
): Promise<{ success: boolean; id?: string; message?: string }> {
  try {
    // Get a valid price ID
    const priceId = await getValidPriceId(customPriceId)

    // Create a test clock for this simulation
    const testClock = await stripe.testHelpers.testClocks.create({
      frozen_time: Math.floor(Date.now() / 1000),
    })

    // Create a customer on the test clock
    const clockCustomer = await stripe.customers.create({
      email: `test-${Date.now()}@example.com`,
      test_clock: testClock.id,
    })

    // Create a subscription with a failing payment
    const subscription = await stripe.subscriptions.create({
      customer: clockCustomer.id,
      items: [{ price: priceId }],
      payment_settings: {
        payment_method_types: ["card"],
        save_default_payment_method: "on_subscription",
      },
      expand: ["latest_invoice.payment_intent"],
      metadata: { test: "true" },
    })

    // Advance the test clock to trigger payment collection
    await stripe.testHelpers.testClocks.advance({
      test_clock: testClock.id,
      frozen_time: Math.floor(Date.now() / 1000) + 60 * 60, // Advance 1 hour
    })

    return {
      success: true,
      id: subscription.id,
      message:
        "Payment failed event simulated. If you have configured Stripe to send payment failed emails, one should be sent to the customer email.",
    }
  } catch (error: any) {
    console.error("Error simulating payment failed:", error)
    return {
      success: false,
      error: error.message || "Failed to simulate payment failed event",
    }
  }
}

/**
 * Simulate a trial ending soon
 */
async function simulateTrialEnding(
  customerId: string,
  customPriceId?: string,
): Promise<{ success: boolean; id?: string; message?: string }> {
  try {
    // Get a valid price ID
    const priceId = await getValidPriceId(customPriceId)

    // Create a test clock for this simulation
    const testClock = await stripe.testHelpers.testClocks.create({
      frozen_time: Math.floor(Date.now() / 1000),
    })

    // Create a customer on the test clock
    const clockCustomer = await stripe.customers.create({
      email: `test-${Date.now()}@example.com`,
      test_clock: testClock.id,
    })

    // Create a subscription with a trial ending soon
    const trialEnd = Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 3 // 3 days from now

    const subscription = await stripe.subscriptions.create({
      customer: clockCustomer.id,
      items: [{ price: priceId }],
      trial_end: trialEnd,
      metadata: { test: "true" },
    })

    // Advance the test clock to trigger the trial ending notification
    await stripe.testHelpers.testClocks.advance({
      test_clock: testClock.id,
      frozen_time: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 2, // Advance 2 days
    })

    return {
      success: true,
      id: subscription.id,
      message:
        "Trial ending event simulated. If you have configured Stripe to send trial ending emails, one should be sent to the customer email when the trial is about to end.",
    }
  } catch (error: any) {
    console.error("Error simulating trial ending:", error)
    return {
      success: false,
      error: error.message || "Failed to simulate trial ending event",
    }
  }
}

/**
 * Simulate a card expiring soon
 */
async function simulateCardExpiring(customerId: string): Promise<{ success: boolean; id?: string; message?: string }> {
  try {
    // For card expiring, we'll use a direct email approach since Stripe doesn't have a direct API for this
    await sendEmail(
      await getCustomerEmail(customerId),
      "Your card is expiring soon",
      emailTemplates.cardExpiring("Customer", "1234"),
    )

    return {
      success: true,
      message:
        "Card expiring notification sent directly via email. Note: This doesn't use Stripe's email system but simulates the notification.",
    }
  } catch (error: any) {
    console.error("Error simulating card expiring:", error)
    return {
      success: false,
      error: error.message || "Failed to simulate card expiring event",
    }
  }
}

/**
 * Get customer email from customer ID
 */
async function getCustomerEmail(customerId: string): Promise<string> {
  const customer = await stripe.customers.retrieve(customerId)
  if (typeof customer === "object" && !customer.deleted && customer.email) {
    return customer.email
  }
  throw new Error("Could not retrieve customer email")
}

/**
 * Simulate an invoice being finalized
 */
async function simulateInvoiceFinalized(
  customerId: string,
  customPriceId?: string,
): Promise<{ success: boolean; id?: string; message?: string }> {
  try {
    // Get a valid price ID
    const priceId = await getValidPriceId(customPriceId)

    // Create an invoice
    const invoice = await stripe.invoices.create({
      customer: customerId,
      collection_method: "send_invoice",
      days_until_due: 30,
      metadata: { test: "true" },
    })

    // Add a line item
    await stripe.invoiceItems.create({
      customer: customerId,
      price: priceId,
      invoice: invoice.id,
    })

    // Finalize the invoice
    const finalizedInvoice = await stripe.invoices.finalizeInvoice(invoice.id)

    // Send the invoice
    await stripe.invoices.sendInvoice(finalizedInvoice.id)

    return {
      success: true,
      id: finalizedInvoice.id,
      message:
        "Invoice finalized and sent. If you have configured Stripe to send invoice emails, one should be sent to the customer email.",
    }
  } catch (error: any) {
    console.error("Error simulating invoice finalized:", error)
    return {
      success: false,
      error: error.message || "Failed to simulate invoice finalized event",
    }
  }
}

/**
 * Simulate a refund
 */
async function simulateRefund(customerId: string): Promise<{ success: boolean; id?: string; message?: string }> {
  try {
    // Create a payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: 2000,
      currency: "usd",
      customer: customerId,
      payment_method_types: ["card"],
      payment_method_data: {
        type: "card",
        card: {
          number: "4242424242424242",
          exp_month: 12,
          exp_year: new Date().getFullYear() + 1,
          cvc: "123",
        },
      },
      confirm: true,
      metadata: { test: "true" },
      return_url: "https://example.com/return",
    })

    // Create a refund
    const refund = await stripe.refunds.create({
      payment_intent: paymentIntent.id,
      metadata: { test: "true" },
    })

    return {
      success: true,
      id: refund.id,
      message:
        "Refund event simulated. If you have configured Stripe to send refund emails, one should be sent to the customer email.",
    }
  } catch (error: any) {
    console.error("Error simulating refund:", error)
    return {
      success: false,
      error: error.message || "Failed to simulate refund event",
    }
  }
}

/**
 * Simulate a payment requiring authentication
 */
async function simulatePaymentRequiresAction(
  customerId: string,
): Promise<{ success: boolean; id?: string; message?: string }> {
  try {
    // For payment requiring authentication, we'll use a direct email approach
    await sendEmail(
      await getCustomerEmail(customerId),
      "Your payment requires authentication",
      emailTemplates.authenticationRequired("Customer", "$20.00", "https://example.com/authenticate"),
    )

    return {
      success: true,
      message:
        "Payment authentication notification sent directly via email. Note: This doesn't use Stripe's email system but simulates the notification.",
    }
  } catch (error: any) {
    console.error("Error simulating payment requires action:", error)
    return {
      success: false,
      error: error.message || "Failed to simulate payment requires action event",
    }
  }
}

/**
 * Simulate a subscription being created
 */
async function simulateSubscriptionCreated(
  customerId: string,
  customPriceId?: string,
): Promise<{ success: boolean; id?: string; message?: string }> {
  try {
    // Get a valid price ID
    const priceId = await getValidPriceId(customPriceId)

    // Create a payment method
    const paymentMethod = await stripe.paymentMethods.create({
      type: "card",
      card: {
        number: "4242424242424242",
        exp_month: 12,
        exp_year: new Date().getFullYear() + 1,
        cvc: "123",
      },
      billing_details: {
        email: await getCustomerEmail(customerId),
      },
    })

    // Attach the payment method to the customer
    await stripe.paymentMethods.attach(paymentMethod.id, {
      customer: customerId,
    })

    // Set as default payment method
    await stripe.customers.update(customerId, {
      invoice_settings: {
        default_payment_method: paymentMethod.id,
      },
    })

    // Create a subscription
    const subscription = await stripe.subscriptions.create({
      customer: customerId,
      items: [{ price: priceId }],
      metadata: { test: "true" },
      expand: ["latest_invoice.payment_intent"],
    })

    return {
      success: true,
      id: subscription.id,
      message:
        "Subscription created event simulated. If you have configured Stripe to send subscription confirmation emails, one should be sent to the customer email.",
    }
  } catch (error: any) {
    console.error("Error simulating subscription created:", error)
    return {
      success: false,
      error: error.message || "Failed to simulate subscription created event",
    }
  }
}

/**
 * Simulate a subscription being canceled
 */
async function simulateSubscriptionCanceled(
  customerId: string,
  customPriceId?: string,
): Promise<{ success: boolean; id?: string; message?: string }> {
  try {
    // Get a valid price ID
    const priceId = await getValidPriceId(customPriceId)

    // Create a payment method
    const paymentMethod = await stripe.paymentMethods.create({
      type: "card",
      card: {
        number: "4242424242424242",
        exp_month: 12,
        exp_year: new Date().getFullYear() + 1,
        cvc: "123",
      },
      billing_details: {
        email: await getCustomerEmail(customerId),
      },
    })

    // Attach the payment method to the customer
    await stripe.paymentMethods.attach(paymentMethod.id, {
      customer: customerId,
    })

    // Set as default payment method
    await stripe.customers.update(customerId, {
      invoice_settings: {
        default_payment_method: paymentMethod.id,
      },
    })

    // Create a subscription
    const subscription = await stripe.subscriptions.create({
      customer: customerId,
      items: [{ price: priceId }],
      metadata: { test: "true" },
    })

    // Cancel the subscription
    const canceledSubscription = await stripe.subscriptions.cancel(subscription.id)

    return {
      success: true,
      id: canceledSubscription.id,
      message:
        "Subscription canceled event simulated. If you have configured Stripe to send cancellation emails, one should be sent to the customer email.",
    }
  } catch (error: any) {
    console.error("Error simulating subscription canceled:", error)
    return {
      success: false,
      error: error.message || "Failed to simulate subscription canceled event",
    }
  }
}

/**
 * Simulate an upcoming invoice
 */
async function simulateUpcomingInvoice(
  customerId: string,
  customPriceId?: string,
): Promise<{ success: boolean; id?: string; message?: string }> {
  try {
    // Get a valid price ID
    const priceId = await getValidPriceId(customPriceId)

    // Create a test clock for this simulation
    const testClock = await stripe.testHelpers.testClocks.create({
      frozen_time: Math.floor(Date.now() / 1000),
    })

    // Create a customer on the test clock
    const clockCustomer = await stripe.customers.create({
      email: await getCustomerEmail(customerId),
      test_clock: testClock.id,
    })

    // Create a payment method
    const paymentMethod = await stripe.paymentMethods.create({
      type: "card",
      card: {
        number: "4242424242424242",
        exp_month: 12,
        exp_year: new Date().getFullYear() + 1,
        cvc: "123",
      },
      billing_details: {
        email: await getCustomerEmail(customerId),
      },
    })

    // Attach the payment method to the customer
    await stripe.paymentMethods.attach(paymentMethod.id, {
      customer: clockCustomer.id,
    })

    // Set as default payment method
    await stripe.customers.update(clockCustomer.id, {
      invoice_settings: {
        default_payment_method: paymentMethod.id,
      },
    })

    // Create a subscription with billing cycle anchor in the future
    const subscription = await stripe.subscriptions.create({
      customer: clockCustomer.id,
      items: [{ price: priceId }],
      billing_cycle_anchor: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7, // 7 days from now
      metadata: { test: "true" },
    })

    // Advance the test clock to trigger the upcoming invoice notification
    await stripe.testHelpers.testClocks.advance({
      test_clock: testClock.id,
      frozen_time: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 6, // Advance 6 days
    })

    return {
      success: true,
      id: subscription.id,
      message:
        "Upcoming invoice event simulated. If you have configured Stripe to send upcoming invoice emails, one should be sent to the customer email before the next billing cycle.",
    }
  } catch (error: any) {
    console.error("Error simulating upcoming invoice:", error)
    return {
      success: false,
      error: error.message || "Failed to simulate upcoming invoice event",
    }
  }
}
