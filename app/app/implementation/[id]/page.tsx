import { redirect } from "next/navigation"

export default function ImplementationPage({ params }: { params: { id: string } }) {
  redirect(`/dashboard/implementation/${params.id}`)
}
