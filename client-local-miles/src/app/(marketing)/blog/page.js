'use client';
import { useState } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowLongRightIcon } from '@heroicons/react/24/solid';
import '@/styles/BlogPage.css';

// --- Animations ---
const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0, 
    transition: { duration: 0.6, ease: "easeOut" } 
  }
};

const stagger = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.15 }
  }
};

// Mock Data
const articles = [
  {
    id: 1,
    date: 'Oct 12, 2024',
    tag: 'Product',
    title: 'Dashboard 2.0: Managing Fleets at Scale',
    excerpt: 'Our latest update brings multi-hub management and real-time battery analytics for electric vehicle fleets, giving you unprecedented control.',
    image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=2070&auto=format&fit=crop' 
  },
  {
    id: 2,
    date: 'Oct 08, 2024',
    tag: 'City Guides',
    title: 'Navigating London\'s New Emission Zones',
    excerpt: 'A comprehensive guide for logistics partners on how to optimize routes under the expanded ULEZ regulations without losing efficiency.',
    image: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?q=80&w=2070&auto=format&fit=crop' 
  },
  {
    id: 3,
    date: 'Sep 30, 2024',
    tag: 'Courier Stories',
    title: 'The Human Element: A Day with Samir',
    excerpt: 'Behind the data: Understanding the challenges and triumphs of the couriers who keep our cities moving, one package at a time.',
    image: 'https://images.unsplash.com/photo-1617347454431-f49d7ff5c3b1?q=80&w=2070&auto=format&fit=crop' 
  }
];

export default function BlogPage() {
  const [activeTab, setActiveTab] = useState('All');
  const tabs = ['All', 'Product', 'Courier Stories', 'City Guides'];

  // Optional: Filter logic if you had more posts
  // const filteredArticles = activeTab === 'All' ? articles : articles.filter(a => a.tag === activeTab);

  return (
    <div className="blog-container">
      
      {/* 1. HEADER & TABS */}
      <section className="blog-header">
        <motion.h1 
          className="blog-title"
          initial="hidden" animate="visible" variants={fadeIn}
        >
          Stories <br /> & Updates
        </motion.h1>

        <div className="tabs-row">
          {tabs.map((tab) => (
            <button 
              key={tab}
              className={`tab-btn ${activeTab === tab ? 'active' : ''}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab}
            </button>
          ))}
        </div>
      </section>

      {/* 2. FEATURED STORY */}
      <motion.section 
        className="featured-section"
        initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeIn}
      >
        <div className="featured-card">
          <div className="featured-img-wrapper">
             {/* Main Featured Image */}
             <Image 
                src="https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?q=80&w=2070&auto=format&fit=crop" 
                alt="Featured Story Image"
                fill
                className="featured-img"
                priority
             />
          </div>
          
          <div className="featured-content">
            <span className="label-featured">Featured Story</span>
            <h2 className="featured-headline">The Future of Last-Mile Delivery in 2024</h2>
            <p className="featured-desc">
              Exploring how logistics innovation, AI routing, and autonomous vehicles 
              are reshaping the final leg of the supply chain to meet modern demands.
            </p>
            <Link href="/blog/post-1" className="read-more-link">
              Read More <ArrowLongRightIcon width={20} />
            </Link>
          </div>
        </div>
      </motion.section>

      {/* 3. LATEST ARTICLES GRID */}
      <section className="articles-section">
        <span className="section-label">Latest Articles</span>
        
        <motion.div 
          className="articles-grid"
          initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-50px" }} variants={stagger}
        >
          {articles.map((article) => (
            <motion.div key={article.id} className="article-card" variants={fadeIn}>
              <div className="card-img-wrapper">
                <Image 
                  src={article.image}
                  alt={article.title}
                  fill
                  className="card-img"
                />
              </div>
              <div className="card-content">
                <div className="card-meta">
                  <span>{article.date}</span> • <span className="tag">{article.tag}</span>
                </div>
                <h3 className="card-title">{article.title}</h3>
                <p className="card-excerpt">{article.excerpt}</p>
                <Link href={`/blog/post-${article.id}`} className="read-more-link">
                  Read More <ArrowLongRightIcon width={16} />
                </Link>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* 4. NEWSLETTER */}
      <section className="newsletter-section">
        <div className="newsletter-inner">
          <div className="nl-text">
            <h2 className="nl-title">Stay Synchronized</h2>
            <p className="nl-desc">
              Join 10,000+ logistics professionals receiving our monthly insights 
              on urban delivery and fleet tech.
            </p>
          </div>
          <form className="nl-form" onSubmit={(e) => e.preventDefault()}>
            <input 
              type="email" 
              placeholder="YOUR@EMAIL.COM" 
              className="nl-input"
            />
            <button className="btn-join">Join</button>
          </form>
        </div>
      </section>

    </div>
  );
}