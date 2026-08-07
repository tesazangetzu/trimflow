import { Suspense } from "react"
import { LandingPage } from "@/components/landing/LandingPage"

export const dynamic = "force-dynamic"

export default function PublicShopPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  return (
    <main className="min-h-screen bg-[#16181A]">
      <Suspense
        fallback={
          <div
            className="flex min-h-screen items-center justify-center"
            style={{ background: "#16181A" }}
          >
            <div className="animate-pulse text-center">
              <div className="mx-auto mb-4 h-3 w-40 border-2 border-[#FFB300]" />
              <div className="h-12 w-64 bg-[#232629]" />
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