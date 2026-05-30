import React, { useState } from 'react';
import { Search, User, ShoppingBag, MapPin, Menu, X } from 'lucide-react';
import { motion } from 'framer-motion';

// Mock Data from Markdown
const NAV_LINKS = ["SHOP NOW", "ORDER INSTANTLY", "SUBSCRIBE & SAVE", "BLOGS", "OUR STORY", "CLEAN LABEL PROMISE", "HEALTHY RECIPES"];
const CATEGORIES = [{
  name: "Protein",
  img: "https://www.thehealthfactory.in/cdn/shop/files/Rectangle_21_1.webp?v=1762508971"
}, {
  name: "Snacking",
  img: "https://www.thehealthfactory.in/cdn/shop/files/Rectangle_19.webp?v=1764830187"
}, {
  name: "Gourmet",
  img: "https://www.thehealthfactory.in/cdn/shop/files/Rectangle_22.webp?v=1764830186"
}, {
  name: "Everyday",
  img: "https://www.thehealthfactory.in/cdn/shop/files/Rectangle_20_1.webp?v=1765437132"
}] as any[];
const PRODUCTS = [{
  name: "Mini Cakes Rich Vanilla (Zero Maida)",
  desc: "4.08 g Protein | 4.55 g Fibre per pack",
  price: "Rs. 60",
  img: "https://www.thehealthfactory.in/cdn/shop/files/ZM_Mini_Cake_Rich_Vanilla_70g_1.webp?v=1765867168",
  badge: "latest launch"
}, {
  name: "Zero Maida Olive & Rosemary Sourdough",
  desc: "37.98 g Protein | 19.87 g Fibre per pack",
  price: "Rs. 128",
  img: "https://www.thehealthfactory.in/cdn/shop/files/OLIVE_ROSEMARY_SOURDOUGH.png?v=1768296149",
  badge: "Healthy, herby, heavenly."
}, {
  name: "Zero Maida Multigrain Low GI Bread",
  desc: "32.83g Protein | 24.30g Fibre per pack",
  price: "Rs. 66",
  img: "https://www.thehealthfactory.in/cdn/shop/files/Copy_of_MULTIGRAIN_LOW_GI_BREAD_2.webp?v=1765202875",
  badge: "latest launch"
}, {
  name: "Zero Maida Rusk - Royal Elaichi (3 Packs)",
  desc: "10.70 g Protein | 8.01 g Fibre per pack",
  price: "Rs. 120",
  img: "https://www.thehealthfactory.in/cdn/shop/files/ZM_Elaichi_Rusk_80g_V2.png?v=1768296147",
  badge: "Zero Maida Crunch"
}] as any[];
const RECIPES = [{
  name: "Dessert",
  img: "https://www.thehealthfactory.in/cdn/shop/files/Rectangle_34_089d66d3-05d2-4911-bd80-ebae130f75f7.webp?v=1765366188"
}, {
  name: "Burger",
  img: "https://www.thehealthfactory.in/cdn/shop/files/Group_205.webp?v=1762750647"
}, {
  name: "Pizza",
  img: "https://www.thehealthfactory.in/cdn/shop/files/Group_212.webp?v=1762750647"
}, {
  name: "Sandwich",
  img: "https://www.thehealthfactory.in/cdn/shop/files/Group_213.webp?v=1762750647"
}] as any[];
const FOOTER_LINKS = {
  SHOP: ["Bestsellers", "Zero Maida", "High Protein", "Multigrain", "Vegan"],
  "ABOUT US": ["Our Story", "Find Us", "Our Blogs", "Contact Us", "Healthy Recipes", "Clean Label Promise"],
  "OUR PRODUCTS": ["Zero Maida Whole Wheat", "Zero Maida Multigrain", "Zero Maida Protein Bread", "Zero Maida Milk Bread", "Zero Maida Rusks", "Zero Maida Low GI Bread", "Zero Maida Classic Sourdough", "Zero Maida Pizza Base", "Zero Maida Burger Bun"],
  HELP: ["Account", "Help & FAQs", "Shipping & Returns"]
};
const INGREDIENTS = ['100% Whole Wheat', 'No Colours', 'No Emulsifiers', 'No Chemical Preservatives', 'Source of Protein & Fibre'];
const ONLINE_PARTNERS = ['Swiggy Instamart', 'Blinkit', 'Zepto', 'BigBasket'];
const OFFLINE_PARTNERS = ["Nature's Basket", 'Star Bazaar', 'Reliance Smart', '7-Eleven'];

// @component: HealthFactoryHomepage
export const HealthFactoryHomepage = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // @return
  return <div className="min-h-screen font-sans overflow-x-hidden" style={{
    backgroundColor: '#F0F5EA',
    color: '#231F14'
  }}>

      {/* Top Banner */}
      <div className="text-white text-xs py-2 text-center uppercase tracking-wider font-semibold" style={{
      backgroundColor: '#3A4A2E'
    }}>
        <span>Deliveries starting at Rs. 20 | Order Now</span>
      </div>

      {/* Navigation */}
      <nav className="sticky top-0 z-50 border-b" style={{
      backgroundColor: '#F0F5EA',
      borderColor: '#DCE9CC'
    }}>
        <div className="max-w-7xl mx-auto px-4 lg:px-8">
          <div className="flex justify-between items-center h-20">

            {/* Mobile Menu Button */}
            <button className="lg:hidden p-2" style={{
            color: '#3A4A2E'
          }} onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>

            {/* Logo */}
            <div className="flex-shrink-0 flex items-center">
              <span className="font-bold text-xl md:text-2xl tracking-tight flex items-center" style={{
              color: '#231F14'
            }}>
                <span>THE </span><span className="mx-1" style={{
                color: '#3A4A2E'
              }}>HEALTH</span><span> FACTORY™</span>
              </span>
            </div>

            {/* Desktop Nav Links */}
            <div className="hidden lg:flex items-center space-x-6">
              {NAV_LINKS.map(link => <a key={link} href="#" className="text-xs font-bold transition-colors tracking-wide hover:opacity-70" style={{
              color: '#3A4A2E'
            }}>
                  {link}
                </a>)}
            </div>

            {/* Right Icons */}
            <div className="flex items-center space-x-4">
              <div className="hidden md:flex items-center rounded-full px-4 py-1.5 text-xs" style={{
              backgroundColor: '#DCE9CC',
              color: '#231F14'
            }}>
                <MapPin size={14} className="mr-1" />
                <span>Choose location</span>
              </div>
              <button style={{
              color: '#3A4A2E'
            }} className="hover:opacity-70 transition-opacity"><Search size={20} /></button>
              <button style={{
              color: '#3A4A2E'
            }} className="hover:opacity-70 transition-opacity"><User size={20} /></button>
              <button style={{
              color: '#3A4A2E'
            }} className="hover:opacity-70 transition-opacity relative">
                <ShoppingBag size={20} />
                <span className="absolute -top-1 -right-1 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center" style={{
                backgroundColor: '#3A4A2E'
              }}>
                  0
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && <div className="lg:hidden absolute top-20 left-0 w-full shadow-lg py-4 px-4 flex flex-col space-y-4" style={{
        backgroundColor: '#F0F5EA'
      }}>
            {NAV_LINKS.map(link => <a key={link} href="#" className="text-sm font-bold pb-2" style={{
          borderBottom: '1px solid #DCE9CC',
          color: '#3A4A2E'
        }}>
                {link}
              </a>)}
          </div>}
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-20 lg:pt-0 lg:pb-0" style={{
      backgroundColor: '#F0F5EA'
    }}>
        <div className="max-w-7xl mx-auto px-4 lg:px-8">
          <div className="flex flex-col lg:flex-row items-center">
            <div className="lg:w-1/2 lg:pr-12 text-center lg:text-left z-10 py-12 lg:py-24">
              <motion.h1 initial={{
              opacity: 0,
              y: 20
            }} animate={{
              opacity: 1,
              y: 0
            }} className="text-5xl md:text-6xl lg:text-7xl font-extrabold uppercase leading-[0.9]" style={{
              color: '#3A4A2E'
            }}>
                Making<br />
                Health Your<br />
                Everyday Staple
              </motion.h1>
              <motion.p initial={{
              opacity: 0,
              y: 20
            }} animate={{
              opacity: 1,
              y: 0
            }} transition={{
              delay: 0.1
            }} className="mt-6 text-lg md:text-xl font-medium" style={{
              color: '#231F14'
            }}>
                Zero maida. No preservatives.<br />
                Just good bread, done better.
              </motion.p>
              <motion.p initial={{
              opacity: 0,
              y: 20
            }} animate={{
              opacity: 1,
              y: 0
            }} transition={{
              delay: 0.2
            }} className="mt-4 text-2xl md:text-3xl font-bold" style={{
              color: '#E8C97A'
            }}>
                Bread Badlo. Aadat Nahi.
              </motion.p>
              <motion.div initial={{
              opacity: 0,
              y: 20
            }} animate={{
              opacity: 1,
              y: 0
            }} transition={{
              delay: 0.3
            }} className="mt-8 flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <button className="px-8 py-3 rounded-full font-bold uppercase tracking-wide transition-opacity hover:opacity-80" style={{
                backgroundColor: '#E8C97A',
                color: '#3A4A2E'
              }}>
                  Shop Now
                </button>
              </motion.div>
            </div>
            <div className="lg:w-1/2 relative mt-12 lg:mt-0">
              <img src="https://www.thehealthfactory.in/cdn/shop/files/Slide-1-Desktop_1.webp?v=1766490464" alt="Father and daughter eating bread" className="w-full h-auto object-cover rounded-xl shadow-2xl lg:shadow-none lg:rounded-none" />
            </div>
          </div>
        </div>
      </section>

      {/* Shop By Top Ranges */}
      <section className="py-16" style={{
      background: 'linear-gradient(to right, #DCE9CC, #F0F5EA)'
    }}>
        <div className="max-w-7xl mx-auto px-4 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-extrabold uppercase tracking-wide mb-10" style={{
          color: '#3A4A2E'
        }}>
            Shop by Top Ranges
          </h2>
          <div className="flex overflow-x-auto pb-8 gap-6 snap-x hide-scrollbar">
            {CATEGORIES.map(cat => <div key={cat.name} className="min-w-[200px] md:min-w-[250px] snap-center group cursor-pointer">
                <div className="relative overflow-hidden rounded-2xl aspect-[4/5] mb-4">
                  <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-all z-10" />
                  <img src={cat.img} alt={cat.name} className="w-full h-full object-cover" />
                </div>
                <h3 className="text-xl font-bold uppercase" style={{
              color: '#3A4A2E'
            }}>{cat.name}</h3>
              </div>)}
          </div>
        </div>
      </section>

      {/* What's In Our Bread */}
      <section className="py-20 text-center" style={{
      backgroundColor: '#3A4A2E',
      color: '#F0F5EA'
    }}>
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="text-3xl md:text-5xl font-extrabold uppercase mb-6 leading-tight">
            What's In Our Bread ?<br />Only What Belongs.
          </h2>
          <p className="text-lg md:text-xl font-semibold mb-12 uppercase tracking-widest" style={{
          color: '#DCE9CC'
        }}>
            Made with 100% Chakki-Fresh Aata
          </p>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-16">
            {INGREDIENTS.map(item => <div key={item} className="flex flex-col items-center">
                <div className="w-20 h-20 rounded-full flex items-center justify-center mb-4" style={{
              backgroundColor: 'rgba(240,245,234,0.1)'
            }}>
                  <div className="w-10 h-10 border-2 border-dashed rounded-full" style={{
                borderColor: '#DCE9CC'
              }} />
                </div>
                <p className="font-semibold text-sm md:text-base uppercase max-w-[120px]">{item}</p>
              </div>)}
          </div>

          <p className="text-xl italic font-medium opacity-90">
            "It takes longer to bake, but that's what makes it better."
          </p>
        </div>
      </section>

      {/* Loaves India Loves */}
      <section className="py-24" style={{
      backgroundColor: '#F0F5EA'
    }}>
        <div className="max-w-7xl mx-auto px-4 lg:px-8">
          <h2 className="text-4xl md:text-5xl font-extrabold uppercase text-center mb-16" style={{
          color: '#3A4A2E'
        }}>
            Loaves India Loves.
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {PRODUCTS.map(prod => <div key={prod.name} className="rounded-3xl p-6 shadow-sm hover:shadow-xl transition-shadow flex flex-col items-center text-center relative group" style={{
            backgroundColor: '#FDFCF8'
          }}>
                <div className="absolute top-4 left-4 text-sm font-bold px-2 py-1 rounded uppercase" style={{
              backgroundColor: '#E8C97A',
              color: '#3A4A2E'
            }}>
                  {prod.badge}
                </div>
                <img src={prod.img} alt={prod.name} className="w-48 h-48 object-contain mb-6 group-hover:scale-105 transition-transform" />
                <h3 className="font-bold text-lg mb-2 h-14" style={{
              color: '#231F14'
            }}>{prod.name}</h3>
                <p className="text-sm mb-6" style={{
              color: '#84a066'
            }}>{prod.desc}</p>
                <div className="mt-auto w-full">
                  <button className="w-full py-3 rounded-xl font-bold uppercase hover:opacity-80 transition-opacity" style={{
                backgroundColor: '#3A4A2E',
                color: '#F0F5EA'
              }}>
                    <span>Add to Cart | </span><span>{prod.price}</span>
                  </button>
                </div>
              </div>)}
          </div>

          <div className="text-center mt-12">
            <button className="bg-transparent px-10 py-3 rounded-full font-bold uppercase transition-all hover:text-white" style={{
            border: '2px solid #3A4A2E',
            color: '#3A4A2E'
          }} onMouseEnter={e => {
            (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#3A4A2E';
            (e.currentTarget as HTMLButtonElement).style.color = '#F0F5EA';
          }} onMouseLeave={e => {
            (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent';
            (e.currentTarget as HTMLButtonElement).style.color = '#3A4A2E';
          }}>
              View All Products
            </button>
          </div>
        </div>
      </section>

      {/* Availability Map */}
      <section className="py-20 relative overflow-hidden" style={{
      backgroundColor: '#DCE9CC'
    }}>
        <div className="max-w-7xl mx-auto px-4 lg:px-8">
          <div className="flex flex-col md:flex-row items-center gap-12">
            <div className="md:w-1/2">
              <h2 className="text-4xl md:text-6xl font-extrabold uppercase leading-tight mb-8" style={{
              color: '#3A4A2E'
            }}>
                Born in Mumbai.<br />Baked for India.
              </h2>

              <div className="mb-8">
                <h3 className="font-bold text-xl uppercase mb-4" style={{
                color: '#231F14'
              }}>Online Partners</h3>
                <div className="flex flex-wrap gap-4">
                  {ONLINE_PARTNERS.map(p => <span key={p} className="px-4 py-2 rounded-lg font-bold text-sm shadow-sm" style={{
                  backgroundColor: '#F0F5EA',
                  color: '#231F14'
                }}>
                      {p}
                    </span>)}
                </div>
              </div>

              <div>
                <h3 className="font-bold text-xl uppercase mb-4" style={{
                color: '#231F14'
              }}>Offline Partners</h3>
                <div className="flex flex-wrap gap-4">
                  {OFFLINE_PARTNERS.map(p => <span key={p} className="px-4 py-2 rounded-lg font-bold text-sm shadow-sm" style={{
                  backgroundColor: '#F0F5EA',
                  color: '#231F14'
                }}>
                      {p}
                    </span>)}
                </div>
              </div>
            </div>

            <div className="md:w-1/2 relative flex justify-center items-center">
              <div className="text-center">
                <span className="text-7xl lg:text-9xl font-black block opacity-40" style={{
                color: '#E8C97A'
              }}>
                  100+
                </span>
                <p className="text-xl font-medium mt-4 max-w-sm mx-auto" style={{
                color: '#231F14'
              }}>
                  Cities strong, starting from Mumbai. The Health Factory breads are closer than you think.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Recipes */}
      <section className="py-20" style={{
      backgroundColor: '#F0F5EA'
    }}>
        <div className="max-w-7xl mx-auto px-4 lg:px-8 text-center">
          <h2 className="text-3xl md:text-5xl font-extrabold uppercase mb-12" style={{
          color: '#3A4A2E'
        }}>
            Flavour-First, Healthy Recipes.
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {RECIPES.map(recipe => <div key={recipe.name} className="group cursor-pointer relative overflow-hidden rounded-2xl">
                <div className="aspect-square" style={{
              backgroundColor: '#DCE9CC'
            }}>
                  <img src={recipe.img} alt={recipe.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                </div>
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="text-white font-bold text-xl tracking-wider uppercase">{recipe.name}</span>
                </div>
              </div>)}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="text-white pt-20 pb-10" style={{
      backgroundColor: '#3A4A2E'
    }}>
        <div className="max-w-7xl mx-auto px-4 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-black uppercase mb-4">Zero Maida. Zero Compromise.</h2>
            <p className="text-lg italic font-medium" style={{
            color: '#DCE9CC'
          }}>
              "We're here to rethink everyday food and make real health effortless. Bread is just the beginning."
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8 pt-16 mb-16" style={{
          borderTop: '1px solid rgba(240,245,234,0.2)'
        }}>
            <div className="col-span-2 lg:col-span-2">
              <span className="font-bold text-3xl tracking-tight flex items-center mb-6">
                <span>THE </span><span className="mx-1" style={{
                color: '#DCE9CC'
              }}>HEALTH</span><span> FACTORY</span>
              </span>
              <p className="text-sm max-w-xs" style={{
              color: 'rgba(240,245,234,0.7)'
            }}>
                Love The Health Factory breads? Get healthy, hustle-friendly recipes straight to your inbox.
              </p>
            </div>

            {Object.entries(FOOTER_LINKS).map(([title, links]) => <div key={title}>
                <h4 className="font-bold mb-4 uppercase" style={{
              color: '#DCE9CC'
            }}>{title}</h4>
                <ul className="space-y-2 text-sm" style={{
              color: 'rgba(240,245,234,0.7)'
            }}>
                  {links.map(link => <li key={link}>
                      <a href="#" className="hover:text-white transition-colors">{link}</a>
                    </li>)}
                </ul>
              </div>)}
          </div>

          <div className="flex flex-col md:flex-row justify-between items-center pt-8 text-xs" style={{
          borderTop: '1px solid rgba(240,245,234,0.2)',
          color: 'rgba(240,245,234,0.5)'
        }}>
            <p>© 2024 The Health Factory</p>
            <div className="flex space-x-4 mt-4 md:mt-0">
              <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-white transition-colors">Terms &amp; Conditions</a>
            </div>
          </div>
        </div>
      </footer>
    </div>;
};