export type ListingStatus = "draft" | "active" | "sold" | "locked";

export type Seller = {
  id: string;
  name: string;
  initials?: string;
  city?: string;
  rating?: number;
  reviews?: number;
  joined?: string;
};

export type Listing = {
  id: string;
  title: string;
  author: string;
  description: string;
  isbn?: string;
  price: number;
  originalPrice?: number;
  images?: string[];
  category: string;
  condition: string;
  city: string;
  color?: string;
  accent?: string;
  status: ListingStatus;
  seller: Seller;
  sellerId?: string;
  posted?: string;
  createdAt?: string;
  saves?: number;
  featured?: boolean;
};

export type Review = {
  id: string;
  listingId: string;
  author: string;
  initials: string;
  rating: number;
  comment: string;
  date: string;
};
