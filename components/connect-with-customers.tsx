"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Calendar, MessageSquare, Phone } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"

interface CustomerReference {
  id: string
  name: string
  title: string
  company: string
  industry: string
  avatarUrl?: string
  availableVia: Array<"call" | "meeting" | "email">
}

interface ConnectWithCustomersProps {
  vendorId: string
  vendorName: string
  customerReferences: CustomerReference[]
}

export function ConnectWithCustomers({ vendorId, vendorName, customerReferences }: ConnectWithCustomersProps) {
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerReference | null>(null)
  const [contactMethod, setContactMethod] = useState<"call" | "meeting" | "email" | null>(null)

  const handleConnect = (customer: CustomerReference, method: "call" | "meeting" | "email") => {
    setSelectedCustomer(customer)
    setContactMethod(method)
  }

  const handleSubmitRequest = () => {
    // In a real implementation, this would send the request to the backend
    alert(`Request sent to connect with ${selectedCustomer?.name} via ${contactMethod}`)
    setSelectedCustomer(null)
    setContactMethod(null)
  }

  // Get initials from name
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Connect with {vendorName} Customers</CardTitle>
        <CardDescription>Speak directly with financial services companies using this solution</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {customerReferences.map((customer) => (
            <div key={customer.id} className="flex items-start justify-between p-4 bg-muted/30 rounded-md">
              <div className="flex items-start gap-3">
                <Avatar>
                  {customer.avatarUrl && <AvatarImage src={customer.avatarUrl} alt={customer.name} />}
                  <AvatarFallback>{getInitials(customer.name)}</AvatarFallback>
                </Avatar>
                <div>
                  <div className="font-medium">{customer.name}</div>
                  <div className="text-sm text-muted-foreground">{customer.title}</div>
                  <div className="text-sm">{customer.company}</div>
                  <Badge variant="outline" className="mt-1">
                    {customer.industry}
                  </Badge>
                </div>
              </div>

              <div className="flex gap-2">
                {customer.availableVia.includes("call") && (
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm" onClick={() => handleConnect(customer, "call")}>
                        <Phone className="h-4 w-4 mr-1" />
                        Call
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Schedule a call with {customer.name}</DialogTitle>
                        <DialogDescription>
                          Fill out this form to request a call with {customer.name} from {customer.company}.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Your Name</label>
                          <Input placeholder="Enter your name" />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Your Email</label>
                          <Input placeholder="Enter your email" />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Questions or Topics</label>
                          <Textarea placeholder="What would you like to discuss?" />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button onClick={handleSubmitRequest}>Request Call</Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                )}

                {customer.availableVia.includes("meeting") && (
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm" onClick={() => handleConnect(customer, "meeting")}>
                        <Calendar className="h-4 w-4 mr-1" />
                        Meeting
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Schedule a meeting with {customer.name}</DialogTitle>
                        <DialogDescription>
                          Fill out this form to request a meeting with {customer.name} from {customer.company}.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Your Name</label>
                          <Input placeholder="Enter your name" />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Your Email</label>
                          <Input placeholder="Enter your email" />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Preferred Date</label>
                          <Input type="date" />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Questions or Topics</label>
                          <Textarea placeholder="What would you like to discuss?" />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button onClick={handleSubmitRequest}>Request Meeting</Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                )}

                {customer.availableVia.includes("email") && (
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm" onClick={() => handleConnect(customer, "email")}>
                        <MessageSquare className="h-4 w-4 mr-1" />
                        Email
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Send a message to {customer.name}</DialogTitle>
                        <DialogDescription>
                          Fill out this form to send a message to {customer.name} from {customer.company}.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Your Name</label>
                          <Input placeholder="Enter your name" />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Your Email</label>
                          <Input placeholder="Enter your email" />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Message</label>
                          <Textarea placeholder="Your message or questions" />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button onClick={handleSubmitRequest}>Send Message</Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
