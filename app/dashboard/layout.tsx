export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="container mx-auto px-8 py-12">{children}</div>;
}