import type { Metadata } from "next";
import { SellerProfile } from "@/components/seller-profile";

export const metadata: Metadata = {
  title: "Reader bookstore",
  description: "Browse a BookSwap reader's public active and sold books.",
};

export default async function SellerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <SellerProfile id={id} />;
}
