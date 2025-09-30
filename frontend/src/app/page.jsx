"use client";

import Link from "next/link";
import { useState, useEffect, useRef, useCallback } from "react";
import Typed from "typed.js";
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
  const [categories, setCategories] = useState([
    {
      id: 1,
      icon: <Code className="w-12 h-12 mx-auto text-orange-600 mb-4" />,
      title: "Web Development",
      desc: "Learn HTML, CSS, JS, React & more"
    },
    {
      id: 2,
      icon: <Database className="w-12 h-12 mx-auto text-blue-600 mb-4" />,
      title: "Data Science",
      desc: "Master Python, ML & AI tools",
    },
    {
      id: 3,
      icon: <Palette className="w-12 h-12 mx-auto text-pink-600 mb-4" />,
      title: "UI / UX Design",
      desc: "Design beautiful interfaces"
    },
    {
      id: 4,
      icon: <Brain className="w-12 h-12 mx-auto text-green-600 mb-4" />,
      title: "AI & Machine Learning",
      desc: "Build intelligent systems",
    },
    {
      id: 5,
      icon: <Smartphone className="w-12 h-12 mx-auto text-purple-600 mb-4" />,
      title: "Mobile Development",
      desc: "Create iOS & Android apps"
    },
    {
      id: 6,
      icon: <Globe className="w-12 h-12 mx-auto text-indigo-600 mb-4" />,
      title: "DevOps & Cloud",
      desc: "Deploy and scale applications"
    },
    {
      id: 7,
      icon: <Monitor className="w-12 h-12 mx-auto text-yellow-600 mb-4" />,
      title: "Game Development",
      desc: "Build games with Unity & Unreal"
    },
    {
      id: 8,
      icon: <Camera className="w-12 h-12 mx-auto text-red-600 mb-4" />,
      title: "Digital Marketing",
      desc: "Grow your online presence"
    }
  ]);
  
  /* ───────── Cart helper ───────── */
  const handleAddToCart = useCallback(async (product) => {
    if (!isLoggedIn) {
      toast.error("Please login to add items to your cart!");
      return;
    }
    
    try {
      // Simple cart functionality - add to localStorage
      const existingCart = JSON.parse(localStorage.getItem('cartItems') || '[]');
      const existingItemIndex = existingCart.findIndex(item => item._id === product._id);
      
      if (existingItemIndex > -1) {
        existingCart[existingItemIndex].quantity += 1;
      } else {
        existingCart.push({ ...product, quantity: 1 });
      }
      
      localStorage.setItem('cartItems', JSON.stringify(existingCart));
      window.dispatchEvent(new Event("cartUpdated"));
      toast.success(`${product.title} added to cart!`);
    } catch (error) {
      console.error('Cart error:', error);
      toast.error("Failed to add to cart");
    }
  }, [isLoggedIn]);
  
  /* ───────── Mock data fetching ───────── */
  const fetchProducts = useCallback(async (currentPage) => {
    setLoading(true);
    setError("");
    
    try {
      // Mock API call - replace with your actual API
      const mockProducts = [
        {
          _id: 1,
          title: "Complete Web Development Course",
          description: "Learn HTML, CSS, JavaScript, React, Node.js and build amazing web applications",
          price: 2999,
          images: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400",
          brand: "TechEdu",
          category: 1
        },
        {
          _id: 2,
          title: "Python for Data Science",
          description: "Master Python programming and data science libraries like pandas, numpy, matplotlib",
          price: 3499,
          images: "https://images.unsplash.com/photo-1526379095098-d400fd0bf935?w=400",
          brand: "DataLearn",
          category: 2
        },
        {
          _id: 3,
          title: "UI/UX Design Masterclass",
          description: "Learn design principles, Figma, Adobe XD and create beautiful user interfaces",
          price: 2799,
          images: "https://images.unsplash.com/photo-1561070791-2526d30994b5?w=400",
          brand: "DesignPro",
          category: 3
        },
        {
          _id: 4,
          title: "Machine Learning with Python",
          description: "Build ML models, work with algorithms and create intelligent applications",
          price: 4999,
          images: "https://images.unsplash.com/photo-1555949963-aa79dcee981c?w=400",
          brand: "AIAcademy",
          category: 4
        },
        {
          _id: 5,
          title: "React Native Mobile Development",
          description: "Create cross-platform mobile apps using React Native and JavaScript",
          price: 3299,
          images: "https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=400",
          brand: "MobileDev",
          category: 5
        },
        {
          _id: 6,
          title: "AWS Cloud Practitioner",
          description: "Learn cloud computing, AWS services and deploy scalable applications",
          price: 3799,
          images: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=400",
          brand: "CloudMaster",
          category: 6
        }
      ];
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const startIndex = (currentPage - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedProducts = mockProducts.slice(startIndex, endIndex);
      
      console.log(`✅ Found ${paginatedProducts.length} products`);
      
      setFeaturedProducts(prevProducts => {
        if (currentPage === 1) {
          return paginatedProducts;
        } else {
          return [...prevProducts, ...paginatedProducts];
        }
      });
      
      setHasMore(endIndex < mockProducts.length);
      
    } catch (error) {
      console.error('❌ Fetch error:', error);
      setError(`Failed to fetch products: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }, [limit]);
  
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
      <div className="bg-white dark:bg-gray-800 shadow-lg p-6 rounded-xl flex flex-col transition-all duration-300 hover:-translate-y-2 hover:scale-105 hover:shadow-2xl">
        {/* Product Image */}
        <div className="relative mb-4 h-48 bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden">
          {shouldShowImage ? (
            <>
              <img
                src={imageUrl}
                alt={product.title}
                className="w-full h-full object-cover transition-transform hover:scale-105"
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
            handleAddToCart(product);
          }}
          disabled={!isLoggedIn}
          className={`mt-auto font-semibold py-3 px-4 rounded-lg shadow-md transition-all duration-300 ${
            isLoggedIn
              ? "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white hover:scale-105 hover:shadow-lg"
              : "bg-gray-300 text-gray-500 cursor-not-allowed"
          }`}
        >
          {isLoggedIn ? "Enroll Now" : "Login to Enroll"}
        </button>
      </div>
    );
  }, [handleAddToCart, isLoggedIn, imageLoadErrors, handleImageError]);
  
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
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            {categories.map((cat, idx) => (
              <Link
                key={cat.id}
                href={`/categories/${cat.id}`}
                className="block bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 text-center transform transition-all duration-300 hover:-translate-y-2 hover:scale-[1.02] hover:shadow-xl group"
              >
                <div className="transform transition-transform duration-300 group-hover:scale-110">
                  {cat.icon}
                </div>
                <h3 className="font-bold text-lg mb-2 text-gray-900 dark:text-white">
                  {cat.title}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  {cat.desc}
                </p>
              </Link>
            ))}
          </div>
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
            Expand Your Knowledge with Premium Products
          </h2>
          <p className="text-xl text-center mb-12 text-gray-600 dark:text-gray-300">
            Start your learning journey with our top-rated courses
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
