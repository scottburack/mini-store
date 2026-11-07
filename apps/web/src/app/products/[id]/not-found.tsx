import Link from "next/link";

export default function ProductNotFound() {
  return (
    <main className="mx-auto w-full max-w-5xl px-6 py-10">
      <h1 className="text-2xl font-semibold">Product not found</h1>
      <p className="mt-2 text-zinc-600">It may have been removed, or the link is wrong.</p>
      <Link href="/" className="mt-6 inline-block text-sm underline">
        Back to products
      </Link>
    </main>
  );
}
