import { Suspense } from "react"
import { ReservationPage } from "@/components/booking/ReservationPage"

export const dynamic = "force-dynamic"

export default function PublicReservePage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  return (
    <main className="min-h-screen">
      <Suspense fallback={<ReserveSkeleton />}>
        <ReservationContent params={params} />
      </Suspense>
    </main>
  )
}

function ReserveSkeleton() {
  return (
    <div
      className="flex min-h-screen items-center justify-center"
      style={{ background: "#0A0A0A" }}
    >
      <div className="animate-pulse text-center">
        <div className="mx-auto mb-4 h-3 w-40" style={{ background: "#111111" }} />
        <div className="h-12 w-64" style={{ background: "#111111" }} />
      </div>
    </div>
  )
}

async function ReservationContent({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  return <ReservationPage slug={slug} />
}