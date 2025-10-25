"use client";

import Link from "next/link";
import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import Typed from "typed.js";
import { apiHelpers } from "@/lib/api";
import {
  Code,
  Database,
  Palette,
  Brain,
  Star,
  Globe,
  Smartphone,
  BookOpen,
  Monitor,
  Cpu,
  Camera,
  Music,
  GamepadIcon,
  ShoppingCart,
  Heart,
  Settings,
  Sparkles,
  Trophy,
  Users,
  Clock,
  TrendingUp
} from "lucide-react";
import { useAuth } from "./context/AuthContext";
import toast from "react-hot-toast";

/* ───────── Icon Mapping ───────── */
const IconMap = {
  Code,
  Database,
  Palette,
  Brain,
  Globe,
  Smartphone,
  BookOpen,
  Monitor,
  Cpu,
  Camera,
  Music,
  GamepadIcon,
  ShoppingCart,
  Heart,
  Settings,
  Star
};

/* ───────── Helper Functions ───────── */
const renderIcon = (iconName, iconClass) => {
  const IconComponent = IconMap[iconName];
  if (IconComponent) {
    return <IconComponent className={iconClass} />;
  }
  return <Code className={iconClass || "w-12 h-12 mx-auto text-orange-600 mb-4"} />;
};

const CATEGORY_ICON_PRESETS = [
  { icon: "Code", color: "text-orange-600" },
  { icon: "Database", color: "text-blue-600" },
  { icon: "Palette", color: "text-pink-600" },
  { icon: "Brain", color: "text-green-600" },
  { icon: "Smartphone", color: "text-purple-600" },
  { icon: "Globe", color: "text-indigo-600" },
  { icon: "Monitor", color: "text-yellow-600" },
  { icon: "Camera", color: "text-red-600" }
];

const CATEGORY_ICON_MAPPING = {
  "web development": { icon: "Code", color: "text-orange-600" },
  "data science": { icon: "Database", color: "text-blue-600" },
  "ui / ux design": { icon: "Palette", color: "text-pink-600" },
  "ai & machine learning": { icon: "Brain", color: "text-green-600" },
  "mobile development": { icon: "Smartphone", color: "text-purple-600" },
  "devops & cloud": { icon: "Globe", color: "text-indigo-600" },
  "game development": { icon: "Monitor", color: "text-yellow-600" },
  "digital marketing": { icon: "Camera", color: "text-red-600" }
};

const DEFAULT_CATEGORIES = [
  { id: 1, name: "Web Development", description: "Learn HTML, CSS, JS, React & more" },
  { id: 2, name: "Data Science", description: "Master Python, ML & AI tools" },
  { id: 3, name: "UI / UX Design", description: "Design beautiful interfaces" },
  { id: 4, name: "AI & Machine Learning", description: "Build intelligent systems" },
  { id: 5, name: "Mobile Development", description: "Create iOS & Android apps" },
  { id: 6, name: "DevOps & Cloud", description: "Deploy and scale applications" },
  { id: 7, name: "Game Development", description: "Build games with Unity & Unreal" },
  { id: 8, name: "Digital Marketing", description: "Grow your online presence" }
];

// Enhanced image URL extraction
const extractImageUrl = (images) => {
  console.log('🔍 Raw images input:', images);
  
  if (!images) {
    console.log('❌ Images is null/undefined');
    return null;
  }
  
  // Handle direct string URL
  if (typeof images === 'string' && images.trim()) {
    const url = images.trim();
    console.log('✅ Direct string URL found:', url);
    return url;
  }
  
  // Handle array of images
  if (Array.isArray(images) && images.length > 0) {
    const firstItem = images[0];
    console.log('🔍 First array item:', firstItem);
    
    // Handle object format: { url: "...", alt: "", isPrimary: false }
    if (typeof firstItem === 'object' && firstItem !== null) {
      if (firstItem.url && typeof firstItem.url === 'string') {
        const url = firstItem.url.trim();
        console.log('✅ URL from object:', url);
        return url;
      }
      
      // Check other possible URL keys
      const possibleUrlKeys = ['url', 'src', 'href', 'link', 'image'];
      for (const key of possibleUrlKeys) {
        if (firstItem[key] && typeof firstItem[key] === 'string') {
          const url = firstItem[key].trim();
          console.log(`✅ URL from object.${key}:`, url);
          return url;
        }
      }
    }
    
    // Handle string in array: ["https://..."]
    if (typeof firstItem === 'string' && firstItem.trim()) {
      const url = firstItem.trim();
      console.log('✅ String URL from array:', url);
      return url;
    }
  }
  
  console.log('❌ No valid image URL found');
  return null;
};

// Enhanced URL validation
const isValidImageUrl = (url) => {
  if (!url || typeof url !== 'string') return false;
  
  const trimmedUrl = url.trim();
  if (trimmedUrl.length === 0) return false;
  
  // Must be a proper URL format
  const urlPattern = /^(https?:\/\/)/i;
  if (!urlPattern.test(trimmedUrl)) {
    console.log('❌ URL does not start with http/https:', trimmedUrl);
    return false;
  }
  
  // Additional checks for common issues
  const hasValidDomain = /^https?:\/\/[a-zA-Z0-9][a-zA-Z0-9-]*[a-zA-Z0-9]*(\.[a-zA-Z]{2,})+/i.test(trimmedUrl);
  if (!hasValidDomain) {
    console.log('❌ URL does not have valid domain:', trimmedUrl);
    return false;
  }
  
  console.log('✅ URL is valid:', trimmedUrl);
  return true;
};

/* ───────── Component ───────── */
export default function Home() {
  const { isLoggedIn } = useAuth();
  const router = useRouter();
  
  /* Featured products */
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const limit = 6;
  const [hasMore, setHasMore] = useState(true);
  const [imageLoadErrors, setImageLoadErrors] = useState({});
  const typedRef = useRef(null);

  // Dynamic elements state
  const [currentFeature, setCurrentFeature] = useState(0);
  
  // Dynamic features data
  const features = [
    { text: "50,000+ Students", icon: Users, color: "text-blue-600", bgColor: "bg-blue-100" },
    { text: "500+ Courses", icon: BookOpen, color: "text-green-600", bgColor: "bg-green-100" },
    { text: "Expert Instructors", icon: Trophy, color: "text-purple-600", bgColor: "bg-purple-100" },
    { text: "Career Growth", icon: TrendingUp, color: "text-orange-600", bgColor: "bg-orange-100" },
    { text: "24/7 Support", icon: Clock, color: "text-pink-600", bgColor: "bg-pink-100" }
  ];
  
  /* Categories */
  const [categories, setCategories] = useState([]);
  const [categoryLoading, setCategoryLoading] = useState(false);
  const [categoryError, setCategoryError] = useState("");
  const [categoryLimit, setCategoryLimit] = useState(4);

  /* ───────── Cart helper ───────── */
  const persistCartItems = useCallback((items) => {
    if (typeof window === "undefined" || !Array.isArray(items)) return;
    try {
      localStorage.setItem("cartItems", JSON.stringify(items));
      window.dispatchEvent(new Event("cartUpdated"));
    } catch (error) {
      console.error("Failed to persist cart items", error);
    }
  }, []);

  const handleAddToCart = useCallback(async (product) => {
    if (!isLoggedIn) {
      toast.error("Please login to add items to your cart!");
      return;
    }

    const courseId = product?._id || product?.id;
    if (!courseId) {
      toast.error("Unable to add this item to the cart");
      return;
    }

    const payload = {
      courseId,
      title: product.title || "Untitled Course",
      price: typeof product.price === "number" ? product.price : Number(product.price) || 0,
      quantity: 1
    };

    try {
      const response = await apiHelpers.cart.addItem(payload);
      const serverItems = response?.data?.cart?.items;

      if (Array.isArray(serverItems) && serverItems.length) {
        persistCartItems(serverItems);
      } else {
        const existingCart = JSON.parse(localStorage.getItem("cartItems") || "[]");
        const existingIndex = existingCart.findIndex((item) => (item._id || item.id || item.courseId) === courseId);

        if (existingIndex > -1) {
          existingCart[existingIndex].quantity = (existingCart[existingIndex].quantity || 1) + 1;
        } else {
          existingCart.push({ ...product, quantity: 1 });
        }

        persistCartItems(existingCart);
      }

      toast.success(`${product.title} added to cart!`);
    } catch (error) {
      console.error("Cart API error", error);

      try {
        const existingCart = JSON.parse(localStorage.getItem("cartItems") || "[]");
        const existingIndex = existingCart.findIndex((item) => (item._id || item.id || item.courseId) === courseId);

        if (existingIndex > -1) {
          existingCart[existingIndex].quantity = (existingCart[existingIndex].quantity || 1) + 1;
        } else {
          existingCart.push({ ...product, quantity: 1 });
        }

        persistCartItems(existingCart);
        toast.success(`${product.title} added to cart!`);
      } catch (localError) {
        console.error("Cart fallback error", localError);
        toast.error("Failed to add to cart");
      }
    }
  }, [isLoggedIn, persistCartItems]);
  
  const getCategoryIcon = useCallback((name, index) => {
    const key = (name || "").toLowerCase();
    const preset = CATEGORY_ICON_MAPPING[key] || CATEGORY_ICON_PRESETS[index % CATEGORY_ICON_PRESETS.length];
    const className = `w-12 h-12 mx-auto ${preset.color} mb-4`;
    return renderIcon(preset.icon, className);
  }, []);

  const fetchCategories = useCallback(async () => {
    setCategoryLoading(true);
    setCategoryError("");

    try {
      const response = await apiHelpers.categories.getAll();
      const list = Array.isArray(response?.data?.data)
        ? response.data.data
        : Array.isArray(response?.data)
        ? response.data
        : [];

      if (!Array.isArray(list) || !list.length) {
        const fallback = DEFAULT_CATEGORIES.map((cat, idx) => ({
          id: cat.id,
          title: cat.name,
          desc: cat.description,
          icon: getCategoryIcon(cat.name, idx),
          slug: cat.id
        }));
        setCategories(fallback);
        return;
      }

      const mapped = list.map((cat, index) => {
        const id = cat._id || cat.id || index;
        const name = cat.name || `Category ${index + 1}`;
        const slug = cat.slug || (typeof id === "number" ? id : encodeURIComponent(String(id)));
        return {
          id,
          title: name,
          desc: cat.description || "Explore curated courses designed by experts",
          icon: getCategoryIcon(name, index),
          slug
        };
      });

      setCategories(mapped);
    } catch (error) {
      console.error("❌ Categories fetch error:", error);
      setCategoryError(error?.response?.data?.message || error?.message || "Unable to load categories.");
      const fallback = DEFAULT_CATEGORIES.map((cat, idx) => ({
        id: cat.id,
        title: cat.name,
        desc: cat.description,
        icon: getCategoryIcon(cat.name, idx),
        slug: cat.id
      }));
      setCategories(fallback);
      setCategoryLimit(Math.min(4, fallback.length));
    } finally {
      setCategoryLoading(false);
    }
  }, [getCategoryIcon]);

  /* ───────── Product fetching (real API) ───────── */
  const fetchProducts = useCallback(
    async (currentPage) => {
      setLoading(true);
      setError("");

      try {
        const response = await apiHelpers.products.getAll({ page: currentPage, limit });
        const fetched = Array.isArray(response?.data?.data)
          ? response.data.data
          : Array.isArray(response?.data)
          ? response.data
          : [];

        if (!Array.isArray(fetched) || fetched.length === 0) {
          if (currentPage === 1) {
            setFeaturedProducts([]);
          }
          setHasMore(false);
          return;
        }

        setFeaturedProducts((prevProducts) => {
          if (currentPage === 1) {
            return fetched;
          }
          const existingIds = new Set(prevProducts.map((item) => item._id));
          const merged = [...prevProducts];
          fetched.forEach((item) => {
            if (!existingIds.has(item._id)) {
              merged.push(item);
            }
          });
          return merged;
        });

        setHasMore(fetched.length === limit);
      } catch (error) {
        console.error("❌ Fetch error:", error);
        const message = error?.response?.data?.msg || error?.message || "Unable to fetch products.";
        setError(`Failed to fetch products: ${message}`);
        toast.error(message);
      } finally {
        setLoading(false);
      }
    },
    [limit]
  );
  
  const loadMoreProducts = useCallback(() => {
    if (!loading && hasMore) {
      setPage(prevPage => prevPage + 1);
    }
  }, [loading, hasMore]);
  
  // Enhanced image error handling
  const handleImageError = useCallback((productId, imageUrl) => {
    console.log(`❌ Image load error for product ${productId}:`, imageUrl);
    setImageLoadErrors(prev => ({
      ...prev,
      [productId]: true
    }));
  }, []);
  
  /* ───────── Effects ───────── */
  useEffect(() => {
    fetchProducts(page);
  }, [page, fetchProducts]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  useEffect(() => {
    setCategoryLimit((limit) => Math.min(limit, Math.max(4, categories.length ? 4 : limit)));
  }, [categories]);

  const displayedCategories = useMemo(() => {
    if (!Array.isArray(categories)) {
      return [];
    }
    return categories.slice(0, categoryLimit);
  }, [categories, categoryLimit]);

  useEffect(() => {
    if (typedRef.current) {
      const typed = new Typed(typedRef.current, {
        strings: ["Learn.", "Build.", "Grow.", "Succeed."],
        typeSpeed: 70,
        backSpeed: 40,
        backDelay: 1500,
        loop: true
      });
      return () => typed.destroy();
    }
  }, []);

  // Dynamic feature cycling effect
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentFeature(prev => (prev + 1) % features.length);
    }, 2500); // Change every 2.5 seconds

    return () => clearInterval(interval);
  }, [features.length]);
  
  /* ───────── Product Card Component ───────── */
  const ProductCard = useCallback(({ product, index }) => {
    const hasImageError = imageLoadErrors[product._id];
    const imageUrl = extractImageUrl(product.images);
    const isValidImage = isValidImageUrl(imageUrl);
    const shouldShowImage = imageUrl && isValidImage && !hasImageError;
    
    return (
      <div
        className="bg-white dark:bg-gray-800 shadow-lg p-6 rounded-xl flex flex-col transform-gpu transition-transform duration-300 ease-out hover:-translate-y-2 hover:shadow-2xl will-change-transform"
      >
        {/* Product Image */}
        <div className="relative mb-4 h-48 bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden">
          {shouldShowImage ? (
            <>
              <img
                src={imageUrl}
                alt={product.title}
                className="w-full h-full object-cover transition-transform duration-300 ease-out hover:scale-105"
                onError={() => handleImageError(product._id, imageUrl)}
                onLoad={() => console.log(`✅ Image loaded for "${product.title}"`)}
                loading="lazy"
              />
              {product.brand && (
                <div className="absolute top-2 right-2 bg-blue-500 text-white text-xs px-2 py-1 rounded-full">
                  {product.brand}
                </div>
              )}
            </>
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 rounded-lg flex flex-col items-center justify-center p-4">
              <BookOpen className="w-16 h-16 text-gray-400 mb-2" />
              <span className="text-gray-500 dark:text-gray-400 text-sm text-center">
                Course Preview
              </span>
            </div>
          )}
        </div>
        
        <h3 className="font-bold text-xl mb-3 text-gray-900 dark:text-white line-clamp-2">
          {product.title}
        </h3>
        
        {product.brand && (
          <p className="text-sm text-blue-600 dark:text-blue-400 font-medium mb-2">
            By {product.brand}
          </p>
        )}
        
        <p className="text-gray-600 dark:text-gray-300 mb-4 line-clamp-3 flex-grow">
          {product.description}
        </p>
        
        <div className="flex items-center justify-between mb-4">
          <p className="font-bold text-2xl text-green-600">
            ₹{product.price.toLocaleString()}
          </p>
          <div className="flex items-center">
            <Star className="w-4 h-4 text-yellow-400 fill-current" />
            <span className="ml-1 text-sm text-gray-600 dark:text-gray-400">4.8</span>
          </div>
        </div>
        
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (!isLoggedIn) {
              router.push("/login");
              return;
            }
            handleAddToCart(product);
          }}
          className={`mt-auto font-semibold py-3 px-4 rounded-lg shadow-md transition-all duration-300 ${
            isLoggedIn
              ? "bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600 text-black hover:scale-105 hover:shadow-lg"
              : "bg-white text-blue-600 border border-blue-200 hover:bg-blue-50"
          }`}
        >
          {isLoggedIn ? "Buy Now" : "Login to Buy"}
        </button>
      </div>
    );
  }, [handleAddToCart, isLoggedIn, imageLoadErrors, handleImageError, router]);
  
  /* ───────── Render ───────── */
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 dark:text-white flex flex-col">
      {/* Hero Section - Fixed Height to Prevent Layout Shift */}
      <section className="text-center py-20 relative bg-gray-50 dark:bg-gray-900">
        {/* Main Content */}
        <div className="relative z-10">
          <h1 className="text-5xl font-bold mb-4">Welcome to CodeShelf</h1>
          <p className="text-xl mb-6">
            Discover professional courses and amazing products to boost your career.
          </p>
          <h2 className="text-2xl font-semibold mb-6">
            <span ref={typedRef} className="text-orange-600"></span>
          </h2>

          {/* Dynamic Feature Display - Fixed Height Container */}
          <div className="mb-8 h-16 flex items-center justify-center">
            <div className="flex justify-center items-center space-x-3 flex-wrap max-w-4xl">
              {features.map((feature, index) => {
                const IconComponent = feature.icon;
                const isActive = index === currentFeature;
                
                return (
                  <div
                    key={index}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-full transition-all duration-700 whitespace-nowrap ${
                      isActive 
                        ? `${feature.bgColor} ${feature.color} scale-110 shadow-lg animate-pulse border-2 border-current` 
                        : 'bg-white text-gray-500 scale-90 opacity-60 border border-gray-200'
                    }`}
                  >
                    <IconComponent className={`w-4 h-4 flex-shrink-0 ${isActive ? feature.color : 'text-gray-400'}`} />
                    <span className={`font-semibold text-sm ${isActive ? feature.color : 'text-gray-500'}`}>
                      {feature.text}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Action Buttons with Enhanced Effects */}
          <div className="flex justify-center gap-4 mt-6">
            <Link
              href="/courses"
              className="relative inline-block px-6 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-yellow-400 to-yellow-500 rounded-lg shadow-md transform transition duration-300 hover:scale-105 hover:from-yellow-500 hover:to-yellow-600 hover:shadow-lg group"
            >
              Get Started
              <span className="absolute inset-0 rounded-lg border-2 border-white opacity-0 transition duration-300 group-hover:opacity-25"></span>
              <Sparkles className="absolute -top-1 -right-1 w-3 h-3 text-yellow-200 opacity-0 group-hover:opacity-100 transition-opacity animate-spin" />
            </Link>

            <Link
              href="/products"
              className="relative inline-block px-6 py-2.5 text-sm font-semibold text-blue-600 bg-white rounded-lg shadow-sm border-2 border-orange-500 transform transition duration-300 hover:scale-105 hover:bg-orange-50 hover:shadow-md group"
            >
              Explore Courses
              <span className="absolute inset-0 rounded-lg opacity-0 transition duration-300 group-hover:opacity-25"></span>
              <BookOpen className="absolute -top-1 -right-1 w-3 h-3 text-orange-500 opacity-0 group-hover:opacity-100 transition-opacity animate-bounce" />
            </Link>
          </div>

          {/* Animated Stats - Fixed Height */}
          <div className="mt-10 h-16 flex items-center justify-center">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-xl">
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600 animate-pulse">50K+</div>
                <div className="text-xs text-gray-600">Students</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600 animate-pulse" style={{ animationDelay: '0.5s' }}>500+</div>
                <div className="text-xs text-gray-600">Courses</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600 animate-pulse" style={{ animationDelay: '1s' }}>100+</div>
                <div className="text-xs text-gray-600">Instructors</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600 animate-pulse" style={{ animationDelay: '1.5s' }}>98%</div>
                <div className="text-xs text-gray-600">Success</div>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Categories Section - Same Background as Hero */}
      <section className="py-16 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-center mb-4 text-gray-900 dark:text-white">
            Explore Categories
          </h2>
          <p className="text-xl text-center mb-12 text-gray-600 dark:text-gray-300">
            Choose from our wide range of professional courses
          </p>
          {categoryError && (
            <div className="mx-auto mb-8 max-w-3xl rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-center text-red-700">
              {categoryError}
            </div>
          )}
          {categoryLoading && !categories.length ? (
            <div className="flex justify-center">
              <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-500 border-r-transparent" />
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {displayedCategories.map((category) => (
                <Link
                  key={category.id}
                  href={`/category/${category.slug}`}
                  className="block rounded-2xl h-full"
                >
                  <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-5 text-center transition-transform duration-300 hover:-translate-y-2 flex flex-col items-center h-full min-h-[220px]">
                    <div className="flex flex-col items-center flex-grow w-full">
                      {category.icon}
                      <h3 className="text-xl font-bold mb-2 text-gray-900 dark:text-white">{category.title}</h3>
                      <p className="text-gray-600 dark:text-gray-400 flex-grow line-clamp-3">{category.desc}</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {categories.length > 4 && (
            <div className="mt-10 flex justify-center">
              <button
                onClick={() =>
                  setCategoryLimit((limit) =>
                    limit >= categories.length ? 4 : Math.min(categories.length, limit + 4)
                  )
                }
                className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-2 text-sm font-semibold text-blue-600 shadow-md transition hover:bg-blue-50 hover:shadow-lg"
              >
                {categoryLimit >= categories.length ? "Show Less Categories" : "Load More Categories"}
              </button>
            </div>
          )}
        </div>
      </section>
      
      {/* Promotional Banner */}
      <div className="bg-gradient-to-r from-orange-500 to-pink-500 text-white text-center py-4 font-semibold">
        <div className="flex items-center justify-center">
          <Heart className="w-5 h-5 mr-2 animate-pulse" />
          🎉 Summer Sale – Get 30% Off on All Courses!
          <Heart className="w-5 h-5 ml-2 animate-pulse" />
        </div>
      </div>
      
      {/* Featured Courses */}
      <section className="py-16 bg-white dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-center mb-4 text-gray-900 dark:text-white">
            Enhance Your Knowledge with Premium eBooks
          </h2>
          <p className="text-xl text-center mb-12 text-gray-600 dark:text-gray-300">
            Discover curated digital resources from our marketplace to supercharge your growth
          </p>
          
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-8 text-center">
              {error}
            </div>
          )}
          
          {featuredProducts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {featuredProducts.map((product, index) => (
                <ProductCard
                  key={`product-${product._id}-${index}`}
                  product={product}
                  index={index}
                />
              ))}
            </div>
          ) : (
            !loading && (
              <div className="text-center py-12">
                <BookOpen className="w-20 h-20 text-gray-300 mx-auto mb-4" />
                <p className="text-xl text-gray-500 dark:text-gray-400">No courses found</p>
                <p className="text-gray-400 dark:text-gray-500">Check back soon for new courses!</p>
              </div>
            )
          )}
          
          {hasMore && (
            <div className="text-center mt-12">
              <button
                onClick={loadMoreProducts}
                disabled={loading}
                className={`px-8 py-4 text-white font-semibold rounded-xl shadow-lg transition-all duration-300 ${
                  loading
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-gradient-to-r from-orange-600 to-pink-600 hover:from-orange-700 hover:to-pink-700 hover:scale-105 hover:shadow-xl"
                }`}
              >
                {loading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-r-transparent mr-3"></div>
                    Loading Courses...
                  </div>
                ) : (
                  <div className="flex items-center">
                    Load More Courses
                    <ShoppingCart className="w-5 h-5 ml-2" />
                  </div>
                )}
              </button>
            </div>
          )}
        </div>
      </section>
      
      {/* Testimonials */}
      <section className="py-16 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold mb-4 text-center text-gray-900 dark:text-white">
            💬 What Our Customers Say
          </h2>
          <p className="text-xl text-center mb-12 text-gray-600 dark:text-gray-300">
            Join thousands of successful learners
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { 
                name: "Aarav", 
                review: "Amazing products! Great quality and fast delivery.", 
                rating: 5 
              },
              { 
                name: "Priya", 
                review: "Excellent customer service and top-notch products.", 
                rating: 4 
              },
              { 
                name: "Rohan", 
                review: "Best online shopping experience I've had!", 
                rating: 5 
              }
            ].map((testimonial, idx) => (
              <div
                key={idx}
                className="bg-white dark:bg-gray-800 shadow-lg p-6 text-center rounded-xl transition-all duration-300 hover:shadow-2xl hover:-translate-y-2"
              >
                <p className="text-gray-700 dark:text-gray-300 mb-4 italic">
                  "{testimonial.review}"
                </p>
                <div className="flex justify-center mb-2">
                  {Array.from({ length: testimonial.rating }).map((_, i) => (
                    <Star key={i} className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                  ))}
                </div>
                <h4 className="font-extrabold">{testimonial.name}</h4>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

