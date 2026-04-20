export interface Product {
  id: string;
  name: string;
  brand: string;
  price: number;
  imageUrl: string;
  category: string;
}

export const CATEGORIES = ['All', 'Outerwear', 'T-Shirts', 'Sweatshirts', 'Knitwear', 'Shirts', 'Misc'];

export const MOCK_PRODUCTS: Product[] = [
  {
    id: 'p1',
    name: 'Blue & Black Check Shirt',
    brand: 'DUMMY WEAR',
    price: 45000,
    imageUrl: 'https://cdn.dummyjson.com/product-images/mens-shirts/blue-&-black-check-shirt/1.webp',
    category: 'Shirts'
  },
  {
    id: 'p2',
    name: 'Gigabyte Aorus Men Tshirt',
    brand: 'GAMER FIT',
    price: 32000,
    imageUrl: 'https://cdn.dummyjson.com/product-images/mens-shirts/gigabyte-aorus-men-tshirt/1.webp',
    category: 'T-Shirts'
  },
  {
    id: 'p3',
    name: 'Man Plaid Shirt',
    brand: 'URBAN',
    price: 38000,
    imageUrl: 'https://cdn.dummyjson.com/product-images/mens-shirts/man-plaid-shirt/1.webp',
    category: 'Shirts'
  },
  {
    id: 'p4',
    name: 'Black Minimalist Sweatshirt',
    brand: 'STUDIO BLANK',
    price: 65000,
    imageUrl: 'https://cdn.dummyjson.com/product-images/mens-shirts/man-short-sleeve-shirt/1.webp',
    category: 'Sweatshirts'
  },
  {
    id: 'p5',
    name: 'Marni Red & Black Suit',
    brand: 'ELEGANCE',
    price: 215000,
    imageUrl: 'https://cdn.dummyjson.com/product-images/womens-dresses/marni-red-&-black-suit/1.webp',
    category: 'Outerwear'
  },
  {
    id: 'p6',
    name: 'Vintage Leather Jacket',
    brand: 'ROUGH',
    price: 189000,
    imageUrl: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?q=80&w=600&auto=format&fit=crop',
    category: 'Outerwear'
  },
  {
    id: 'p7',
    name: 'Classic Basic T-Shirt',
    brand: 'COTTON LAB',
    price: 29000,
    imageUrl: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?q=80&w=600&auto=format&fit=crop',
    category: 'T-Shirts'
  },
  {
    id: 'p8',
    name: 'Men Check Shirt',
    brand: 'STUDIO BLANK',
    price: 35000,
    imageUrl: 'https://cdn.dummyjson.com/product-images/mens-shirts/men-check-shirt/1.webp',
    category: 'Shirts'
  },
  {
    id: 'p9',
    name: 'Signature Logo T-Shirt',
    brand: 'URBAN',
    price: 45000,
    imageUrl: 'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?q=80&w=600&auto=format&fit=crop',
    category: 'T-Shirts'
  },
  {
    id: 'p10',
    name: 'Oversized Plaid Shirt',
    brand: 'COTTON LAB',
    price: 68000,
    imageUrl: 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?q=80&w=600&auto=format&fit=crop',
    category: 'Shirts'
  },
  {
    id: 'p11',
    name: 'Corset Leather With Skirt',
    brand: 'ROUGH',
    price: 135000,
    imageUrl: 'https://cdn.dummyjson.com/product-images/womens-dresses/corset-leather-with-skirt/1.webp',
    category: 'Misc'
  },
  {
    id: 'p12',
    name: 'Black Women\'s Gown',
    brand: 'ELEGANCE',
    price: 185000,
    imageUrl: 'https://cdn.dummyjson.com/product-images/womens-dresses/black-women\'s-gown/1.webp',
    category: 'Knitwear'
  },
  {
    id: 'p13',
    name: 'Dress Pea Green',
    brand: 'WARMTH',
    price: 89000,
    imageUrl: 'https://cdn.dummyjson.com/product-images/womens-dresses/dress-pea/1.webp',
    category: 'Misc'
  },
  {
    id: 'p14',
    name: 'Nike Air Jordan 1 Red/Black',
    brand: 'NIKE',
    price: 245000,
    imageUrl: 'https://cdn.dummyjson.com/product-images/mens-shoes/nike-air-jordan-1-red-and-black/1.webp',
    category: 'Misc'
  },
  {
    id: 'p15',
    name: 'Puma Future Rider Trainers',
    brand: 'PUMA',
    price: 125000,
    imageUrl: 'https://cdn.dummyjson.com/product-images/mens-shoes/puma-future-rider-trainers/1.webp',
    category: 'Misc'
  },
  {
    id: 'p16',
    name: 'Corset With Black Skirt',
    brand: 'COTTON LAB',
    price: 45000,
    imageUrl: 'https://cdn.dummyjson.com/product-images/womens-dresses/corset-with-black-skirt/1.webp',
    category: 'Misc'
  },
  {
    id: 'p17',
    name: 'Classic White Crop Tee',
    brand: 'ROUGH',
    price: 32000,
    imageUrl: 'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?q=80&w=600&auto=format&fit=crop',
    category: 'T-Shirts'
  },
  {
    id: 'p18',
    name: 'Cozy Beige Turtleneck Knit',
    brand: 'OUR STUDIO',
    price: 95000,
    imageUrl: '/images/beige-turtleneck.png',
    category: 'Knitwear'
  },
  {
    id: 'p19',
    name: 'Brooklyn Grey Sweatshirt',
    brand: 'CIDER',
    price: 49000,
    imageUrl: '/images/brooklyn-sweatshirt.png',
    category: 'Sweatshirts'
  },
  {
    id: 'p20',
    name: 'White Duffle Zip-up Jacket',
    brand: 'WINTER LAB',
    price: 115000,
    imageUrl: '/images/white-duffle-jacket.png',
    category: 'Outerwear'
  }
];
