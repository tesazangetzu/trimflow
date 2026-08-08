import { Suspense } from "react"
import { LandingPage } from "@/components/landing/LandingPage"

export const dynamic = "force-dynamic"

export default function PublicShopPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  return (
    <main className="min-h-screen bg-[#0A0A0A]">
      <Suspense
        fallback={
          <div
            className="flex min-h-screen items-center justify-center"
            style={{ background: "#0A0A0A" }}
          >
            <div className="animate-pulse text-center">
              <div className="mx-auto mb-4 h-3 w-40 border-2 border-[#C9A227]" />
              <div className="h-12 w-64 bg-[#111111]" />
            </div>
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
  return <LandingPage slug={slug} />
}