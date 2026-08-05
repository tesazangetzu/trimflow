import { Suspense } from "react"
import { BookingWizard } from "@/components/booking/BookingWizard"

export const dynamic = "force-dynamic"

export default function PublicShopPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  return (
    <main className="min-h-screen bg-background">
      <Suspense
        fallback={
          <div className="mx-auto max-w-xl animate-pulse space-y-4 py-10">
            <div className="h-8 w-2/3 rounded bg-muted" />
            <div className="h-40 rounded-2xl bg-muted" />
          </div>
        }
      >
        <SlugContent params={params} />
      </Suspense>
    </main>
  )
}

async function SlugContent({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  return <BookingWizard slug={slug} />
}