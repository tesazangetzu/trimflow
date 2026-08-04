import SuperAdminLayout from "@/components/layouts/super-admin-layout"

export default function Layout({ children }: { children: React.ReactNode }) {
  return <SuperAdminLayout>{children}</SuperAdminLayout>
}
