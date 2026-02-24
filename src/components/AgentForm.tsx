"use client"

import { useState } from "react"
import { useForm, useFieldArray } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { Loader2, Plus, Trash2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"

const AVAILABLE_COLLECTIONS = [
    { id: "finance_transactions", label: "Finance Transactions" },
    { id: "sales_deals", label: "Sales Deals" },
    { id: "hr_employees", label: "HR Employees" },
]

const agentSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    collections: z.array(z.string()).refine((value: string[]) => value.some((item) => item), {
        message: "You have to select at least one collection.",
    }),
    intents: z.array(
        z.object({
            keywords: z.string().min(1, "Keywords are required"),
            collection: z.string().min(1, "Collection is required"),
        })
    ).min(1, "Define at least one intent mapping"),
})

type AgentFormValues = z.infer<typeof agentSchema>

export function AgentForm() {
    const router = useRouter()
    const { user } = useAuth()
    const [isLoading, setIsLoading] = useState(false)

    const form = useForm<AgentFormValues>({
        resolver: zodResolver(agentSchema),
        defaultValues: {
            name: "",
            collections: [],
            intents: [{ keywords: "", collection: "" }],
        },
    })

    const { fields, append, remove } = useFieldArray({
        control: form.control,
        name: "intents",
    })

    async function onSubmit(data: AgentFormValues) {
        if (!user) {
            router.push("/auth/login")
            return
        }

        setIsLoading(true)
        try {
            // Transform intents to intentMappings format
            const intentMappings = data.intents.map((intent: { keywords: string; collection: string }) => ({
                intent: intent.keywords.split(",")[0].trim() || "general",
                keywords: intent.keywords.split(",").map(k => k.trim()).filter(k => k),
                collections: [intent.collection]
            }))

            const response = await fetch("/api/agents", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    name: data.name,
                    description: "",
                    collections: data.collections,
                    intentMappings,
                    userId: user.uid,
                }),
            })

            if (!response.ok) {
                const error = await response.json()
                throw new Error(error.message || "Failed to create agent")
            }

            const agent = await response.json()
            router.push(`/agents/${agent.id}/chat`)
        } catch (error) {
            console.error("Error creating agent:", error)
            // In a real app, show toast error
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <Card>
                <CardHeader>
                    <CardTitle>Agent Details</CardTitle>
                    <CardDescription>
                        Give your agent a name and select the data sources it can access.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">Agent Name</Label>
                        <Input
                            id="name"
                            placeholder="e.g., Finance Assistant"
                            {...form.register("name")}
                        />
                        {form.formState.errors.name && (
                            <p className="text-sm text-red-500">{form.formState.errors.name.message}</p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label>Data Collections</Label>
                        <div className="grid gap-2">
                            {AVAILABLE_COLLECTIONS.map((item) => (
                                <div key={item.id} className="flex items-center space-x-2">
                                    <Checkbox
                                        id={item.id}
                                        checked={form.watch("collections")?.includes(item.id)}
                                        onCheckedChange={(checked) => {
                                            const current = form.watch("collections") || []
                                            if (checked) {
                                                form.setValue("collections", [...current, item.id])
                                            } else {
                                                form.setValue(
                                                    "collections",
                                                    current.filter((value: string) => value !== item.id)
                                                )
                                            }
                                        }}
                                    />
                                    <Label htmlFor={item.id}>{item.label}</Label>
                                </div>
                            ))}
                        </div>
                        {form.formState.errors.collections && (
                            <p className="text-sm text-red-500">{form.formState.errors.collections.message}</p>
                        )}
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Intent Mapping</CardTitle>
                    <CardDescription>
                        Define how user questions map to specific collections.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {fields.map((field, index) => (
                        <div key={field.id} className="flex gap-4 items-start p-4 border rounded-lg">
                            <div className="flex-1 space-y-2">
                                <Label>Keywords (comma separated)</Label>
                                <Textarea
                                    placeholder="revenue, profit, sales, earnings"
                                    {...form.register(`intents.${index}.keywords`)}
                                />
                                {form.formState.errors.intents?.[index]?.keywords && (
                                    <p className="text-sm text-red-500">
                                        {form.formState.errors.intents[index]?.keywords?.message}
                                    </p>
                                )}
                            </div>

                            <div className="flex-1 space-y-2">
                                <Label>Target Collection</Label>
                                <select
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                    {...form.register(`intents.${index}.collection`)}
                                >
                                    <option value="">Select a collection</option>
                                    {AVAILABLE_COLLECTIONS.map((col) => (
                                        <option key={col.id} value={col.id}>
                                            {col.label}
                                        </option>
                                    ))}
                                </select>
                                {form.formState.errors.intents?.[index]?.collection && (
                                    <p className="text-sm text-red-500">
                                        {form.formState.errors.intents[index]?.collection?.message}
                                    </p>
                                )}
                            </div>

                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="mt-8"
                                onClick={() => remove(index)}
                            >
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </div>
                    ))}

                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="mt-2"
                        onClick={() => append({ keywords: "", collection: "" })}
                    >
                        <Plus className="mr-2 h-4 w-4" />
                        Add Intent
                    </Button>

                    {form.formState.errors.intents && (
                        <p className="text-sm text-red-500">{form.formState.errors.intents.message}</p>
                    )}
                </CardContent>
                <CardFooter>
                    <Button type="submit" disabled={isLoading} className="w-full">
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Create Agent
                    </Button>
                </CardFooter>
            </Card>
        </form>
    )
}
