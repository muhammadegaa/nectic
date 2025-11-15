import { Card } from "@/components/ui/card"
import { Play } from "lucide-react"

export default function DemoPreview() {
  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-muted">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-4xl sm:text-5xl font-bold text-foreground mb-4 text-balance">See It In Action</h2>
          <p className="text-lg text-foreground/60 max-w-2xl mx-auto">
            Watch how Nectic powers intelligent conversations with your private data.
          </p>
        </div>

        <div className="relative">
          <Card className="overflow-hidden bg-card border-border">
            <div className="relative bg-background">
              <img src="/nectic-dashboard-showing-agent-chat-interface-with.jpg" alt="Nectic interactive dashboard" className="w-full h-auto" />
              <div className="absolute inset-0 flex items-center justify-center bg-black/20 hover:bg-black/30 transition-colors cursor-pointer group">
                <div className="w-16 h-16 rounded-full bg-white/90 flex items-center justify-center group-hover:bg-white transition-colors">
                  <Play className="w-6 h-6 text-primary fill-primary" />
                </div>
              </div>
            </div>
          </Card>

          <p className="text-center text-foreground/50 text-sm mt-4">Click to watch the full product demo →</p>
        </div>
      </div>
    </section>
  )
}
