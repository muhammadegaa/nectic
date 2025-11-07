"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Search, MessageSquare, HelpCircle, Book, FileText, Users } from "lucide-react"

// Mock FAQ data
const faqData = [
  {
    question: "How do I get started with Nectic?",
    answer: "To get started with Nectic, first complete your profile and industry information. Then, explore the recommended opportunities on your dashboard. You can click on any opportunity to view details and start implementation.",
  },
  {
    question: "How are opportunities generated?",
    answer: "Opportunities are generated based on your industry, company size, and current technology stack. Our AI analyzes thousands of successful implementations to recommend the most impactful opportunities for your business.",
  },
  {
    question: "How accurate are the ROI projections?",
    answer: "ROI projections are based on historical data from similar implementations in your industry. While we strive for accuracy, actual results may vary based on your specific implementation and business conditions.",
  },
  {
    question: "Can I customize the implementation timeline?",
    answer: "Yes, you can customize the implementation timeline based on your team's capacity and priorities. The default timeline is a suggestion based on typical implementation durations.",
  },
  {
    question: "How do I track my progress?",
    answer: "You can track your progress in the Analytics section of your dashboard. This shows implementation status, time saved, and financial impact across all your opportunities.",
  },
]

// Mock support tickets
const supportTickets = [
  {
    id: "TKT-001",
    subject: "Cannot access opportunity details",
    status: "Open",
    priority: "High",
    createdAt: "2023-06-15",
  },
  {
    id: "TKT-002",
    subject: "ROI calculation question",
    status: "In Progress",
    priority: "Medium",
    createdAt: "2023-06-14",
  },
  {
    id: "TKT-003",
    subject: "Feature request: Custom categories",
    status: "Closed",
    priority: "Low",
    createdAt: "2023-06-10",
  },
]

export default function HelpPage() {
  const [activeTab, setActiveTab] = useState("faq")
  const [searchQuery, setSearchQuery] = useState("")
  const [newTicket, setNewTicket] = useState({
    subject: "",
    description: "",
    priority: "Medium",
  })

  // Filter FAQ based on search query
  const filteredFaq = faqData.filter(
    (item) =>
      item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.answer.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleSubmitTicket = (e: React.FormEvent) => {
    e.preventDefault()
    // In a real app, this would submit to an API
    console.log("Submitting ticket:", newTicket)
    // Reset form
    setNewTicket({
      subject: "",
      description: "",
      priority: "Medium",
    })
    alert("Support ticket submitted successfully!")
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Help & Support</h1>

      <Tabs defaultValue="faq" className="space-y-4" onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="faq">FAQ</TabsTrigger>
          <TabsTrigger value="support">Support Tickets</TabsTrigger>
          <TabsTrigger value="contact">Contact Us</TabsTrigger>
        </TabsList>

        <TabsContent value="faq" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Frequently Asked Questions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative mb-6">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search FAQs..."
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <div className="space-y-4">
                {filteredFaq.map((item, index) => (
                  <Card key={index}>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg">{item.question}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-600">{item.answer}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="support" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Your Support Tickets</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {supportTickets.map((ticket) => (
                    <Card key={ticket.id}>
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-medium">{ticket.subject}</h3>
                            <p className="text-sm text-gray-500">ID: {ticket.id}</p>
                          </div>
                          <div className="text-right">
                            <span
                              className={`inline-block px-2 py-1 text-xs rounded-full ${
                                ticket.status === "Open"
                                  ? "bg-red-100 text-red-800"
                                  : ticket.status === "In Progress"
                                  ? "bg-blue-100 text-blue-800"
                                  : "bg-green-100 text-green-800"
                              }`}
                            >
                              {ticket.status}
                            </span>
                            <p className="text-xs text-gray-500 mt-1">{ticket.createdAt}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Submit a New Ticket</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmitTicket} className="space-y-4">
                  <div>
                    <label htmlFor="subject" className="block text-sm font-medium mb-1">
                      Subject
                    </label>
                    <Input
                      id="subject"
                      value={newTicket.subject}
                      onChange={(e) => setNewTicket({ ...newTicket, subject: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="description" className="block text-sm font-medium mb-1">
                      Description
                    </label>
                    <Textarea
                      id="description"
                      value={newTicket.description}
                      onChange={(e) => setNewTicket({ ...newTicket, description: e.target.value })}
                      required
                      rows={4}
                    />
                  </div>
                  <div>
                    <label htmlFor="priority" className="block text-sm font-medium mb-1">
                      Priority
                    </label>
                    <select
                      id="priority"
                      className="w-full rounded-md border border-gray-300 p-2"
                      value={newTicket.priority}
                      onChange={(e) => setNewTicket({ ...newTicket, priority: e.target.value })}
                    >
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                    </select>
                  </div>
                  <Button type="submit" className="w-full">
                    Submit Ticket
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="contact" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardContent className="p-6 flex flex-col items-center text-center">
                <MessageSquare className="h-10 w-10 text-blue-500 mb-2" />
                <h3 className="font-medium mb-1">Live Chat</h3>
                <p className="text-sm text-gray-500 mb-4">Chat with our support team in real-time</p>
                <Button>Start Chat</Button>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6 flex flex-col items-center text-center">
                <HelpCircle className="h-10 w-10 text-green-500 mb-2" />
                <h3 className="font-medium mb-1">Help Center</h3>
                <p className="text-sm text-gray-500 mb-4">Browse our comprehensive knowledge base</p>
                <Button variant="outline">Visit Help Center</Button>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6 flex flex-col items-center text-center">
                <Book className="h-10 w-10 text-purple-500 mb-2" />
                <h3 className="font-medium mb-1">Documentation</h3>
                <p className="text-sm text-gray-500 mb-4">Detailed guides and API documentation</p>
                <Button variant="outline">View Docs</Button>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Contact Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <h3 className="font-medium mb-2">Email</h3>
                  <p className="text-gray-600">support@nectic.ai</p>
                </div>
                <div>
                  <h3 className="font-medium mb-2">Phone</h3>
                  <p className="text-gray-600">+1 (555) 123-4567</p>
                </div>
                <div>
                  <h3 className="font-medium mb-2">Hours</h3>
                  <p className="text-gray-600">Monday - Friday, 9am - 5pm EST</p>
                </div>
                <div>
                  <h3 className="font-medium mb-2">Address</h3>
                  <p className="text-gray-600">123 AI Street, Tech City, TC 12345</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}