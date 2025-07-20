'use client'

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  Play,
  Users,
  BookOpen,
  BarChart3,
  Calendar,
  DollarSign,
  Settings,
  Menu,
  X,
  Star,
  Zap,
  Shield,
  TrendingUp
} from "lucide-react";

export default function ModernPallisaLanding() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const features = [
    {
      icon: Users,
      title: "Smart Student Management",
      description: "AI-powered enrollment, attendance tracking, and academic progress monitoring with real-time insights.",
      gradient: "from-purple-500 to-pink-500"
    },
    {
      icon: BookOpen,
      title: "Dynamic Academic Records",
      description: "Intelligent grade management with predictive analytics and personalized learning pathways.",
      gradient: "from-blue-500 to-cyan-500"
    },
    {
      icon: Users,
      title: "Teacher Excellence Hub",
      description: "Advanced faculty management with performance analytics and professional development tracking.",
      gradient: "from-emerald-500 to-teal-500"
    },
    {
      icon: DollarSign,
      title: "Financial Intelligence",
      description: "Smart budget management with automated reporting and predictive financial modeling.",
      gradient: "from-orange-500 to-red-500"
    },
    {
      icon: Calendar,
      title: "Intelligent Scheduling",
      description: "AI-optimized timetables with conflict resolution and automated event management.",
      gradient: "from-indigo-500 to-purple-500"
    },
    {
      icon: BarChart3,
      title: "Advanced Analytics",
      description: "Machine learning insights for academic performance and operational optimization.",
      gradient: "from-pink-500 to-rose-500"
    }
  ];

  const stats = [
    { number: "2000+", label: "Active Students", icon: Users },
    { number: "150+", label: "Expert Teachers", icon: Star },
    { number: "25+", label: "Subjects", icon: BookOpen },
    { number: "100%", label: "Digital", icon: Zap }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 text-white overflow-hidden">
      {/* Animated Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-r from-blue-400/20 to-purple-400/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-gradient-to-r from-pink-400/20 to-cyan-400/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 right-1/3 w-64 h-64 bg-gradient-to-r from-emerald-400/20 to-blue-400/20 rounded-full blur-3xl animate-pulse delay-2000"></div>
      </div>

      {/* Navigation */}
      <nav className={`fixed top-0 w-full z-50 transition-all duration-300 ${
        scrollY > 50 ? 'bg-slate-900/90 backdrop-blur-xl border-b border-white/10' : 'bg-transparent'
      }`}>
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Link href="/" className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-purple-500 rounded-xl flex items-center justify-center">
                  <BookOpen className="w-6 h-6 text-white" />
                </div>
                <span className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                  PALLISA
                </span>
              </Link>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              <Link href="#features" className="text-slate-300 hover:text-white transition-colors">Features</Link>
              <Link href="#about" className="text-slate-300 hover:text-white transition-colors">About</Link>
              <Link href="#contact" className="text-slate-300 hover:text-white transition-colors">Contact</Link>
              <Link href="/login" className="text-slate-300 hover:text-white transition-colors">Login</Link>
              <Link href="/register" className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full hover:from-blue-600 hover:to-purple-600 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl">
                Get Started
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <button 
              className="md:hidden p-2 rounded-lg hover:bg-white/10 transition-colors"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

          {/* Mobile Navigation */}
          {isMenuOpen && (
            <div className="md:hidden absolute top-full left-0 right-0 bg-slate-900/95 backdrop-blur-xl border-b border-white/10 p-6 space-y-4">
              <Link href="#features" className="block text-slate-300 hover:text-white transition-colors">Features</Link>
              <Link href="#about" className="block text-slate-300 hover:text-white transition-colors">About</Link>
              <Link href="#contact" className="block text-slate-300 hover:text-white transition-colors">Contact</Link>
              <Link href="/login" className="block w-full text-left text-slate-300 hover:text-white transition-colors">Login</Link>
              <Link href="/register" className="w-full px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full text-center">
                Get Started
              </Link>
            </div>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-6">
        <div className="container mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-500/30 rounded-full mb-8 backdrop-blur-sm">
            <Zap className="w-4 h-4 mr-2 text-blue-400" />
            <span className="text-blue-300 font-medium">Next-Gen School Management</span>
          </div>

          {/* Main Heading */}
          <h1 className="text-5xl md:text-7xl font-bold mb-8 leading-tight">
            <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              Transform
            </span>
            <br />
            <span className="text-white">Education at</span>
            <br />
            <span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
              Pallisa High School
            </span>
          </h1>

          <p className="text-xl text-slate-300 mb-12 max-w-3xl mx-auto leading-relaxed">
            Revolutionary school management system powered by AI and modern design. 
            Streamline operations, enhance learning outcomes, and create the future of education.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
            <Link href="/dashboard" className="group px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full font-semibold hover:from-blue-600 hover:to-purple-600 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-2xl flex items-center">
              Access School Portal
              <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link href="/demo" className="group px-8 py-4 border border-white/20 rounded-full font-semibold hover:bg-white/10 transition-all duration-300 flex items-center">
              <Play className="mr-2 w-5 h-5 group-hover:scale-110 transition-transform" />
              Watch Demo
            </Link>
          </div>

          {/* Interactive Dashboard Preview */}
          <div className="relative max-w-5xl mx-auto">
            <div className="relative bg-gradient-to-r from-slate-800/50 to-slate-900/50 rounded-3xl p-8 backdrop-blur-xl border border-white/10 shadow-2xl">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-4">
                  <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                  <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                  <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                </div>
                <div className="text-slate-400 text-sm">Pallisa School Dashboard</div>
              </div>
              <div className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-2xl h-80 flex items-center justify-center border border-white/5">
                <div className="text-center">
                  <div className="w-20 h-20 bg-gradient-to-br from-blue-400 to-purple-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <BookOpen className="w-10 h-10 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-2">Smart Dashboard</h3>
                  <p className="text-slate-300">AI-Powered School Management</p>
                </div>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-20">
            {stats.map((stat, index) => (
              <div key={index} className="text-center group">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300 border border-white/10">
                  <stat.icon className="w-8 h-8 text-blue-400" />
                </div>
                <div className="text-3xl font-bold text-white mb-1">{stat.number}</div>
                <div className="text-slate-400">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-6 relative">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Powerful Features for
              <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent block">
                Modern Education
              </span>
            </h2>
            <p className="text-xl text-slate-300 max-w-3xl mx-auto">
              Experience the future of school management with AI-driven insights, 
              seamless integration, and intuitive design.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="group relative">
                <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-2xl p-8 backdrop-blur-xl border border-white/10 hover:border-white/20 transition-all duration-300 transform hover:scale-105 h-full">
                  <div className={`w-16 h-16 bg-gradient-to-br ${feature.gradient} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                    <feature.icon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-4">{feature.title}</h3>
                  <p className="text-slate-300 leading-relaxed">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Process Section */}
      <section className="py-20 px-6">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Get Started in
              <span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent block">
                Three Simple Steps
              </span>
            </h2>
            <p className="text-xl text-slate-300 max-w-3xl mx-auto">
              Transform your school operations with our streamlined onboarding process
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: "01",
                title: "Setup School Profile",
                description: "Create your comprehensive school profile with intelligent setup wizards and automated configurations."
              },
              {
                step: "02", 
                title: "Import & Sync Data",
                description: "Seamlessly migrate existing data with our smart import tools and real-time synchronization."
              },
              {
                step: "03",
                title: "Go Live & Excel",
                description: "Launch your digital transformation with ongoing support and continuous optimization."
              }
            ].map((item, index) => (
              <div key={index} className="text-center group">
                <div className="relative mb-8">
                  <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-500 rounded-3xl flex items-center justify-center mx-auto shadow-lg group-hover:scale-110 transition-transform duration-300">
                    <span className="text-2xl font-bold text-white">{item.step}</span>
                  </div>
                  {index < 2 && (
                    <div className="hidden md:block absolute top-12 left-full w-full h-0.5 bg-gradient-to-r from-blue-500/50 to-purple-500/50"></div>
                  )}
                </div>
                <h3 className="text-xl font-bold text-white mb-4">{item.title}</h3>
                <p className="text-slate-300 leading-relaxed">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Growth Section */}
      <section className="py-20 px-6">
        <div className="container mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="relative">
              <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-3xl p-8 backdrop-blur-xl border border-white/10">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-2xl p-6 border border-white/10">
                    <TrendingUp className="w-8 h-8 text-blue-400 mb-4" />
                    <div className="text-2xl font-bold text-white">95%</div>
                    <div className="text-slate-300">Efficiency Boost</div>
                  </div>
                  <div className="bg-gradient-to-br from-emerald-500/20 to-teal-500/20 rounded-2xl p-6 border border-white/10">
                    <Shield className="w-8 h-8 text-emerald-400 mb-4" />
                    <div className="text-2xl font-bold text-white">100%</div>
                    <div className="text-slate-300">Secure</div>
                  </div>
                  <div className="bg-gradient-to-br from-pink-500/20 to-rose-500/20 rounded-2xl p-6 border border-white/10">
                    <Users className="w-8 h-8 text-pink-400 mb-4" />
                    <div className="text-2xl font-bold text-white">2K+</div>
                    <div className="text-slate-300">Students</div>
                  </div>
                  <div className="bg-gradient-to-br from-orange-500/20 to-red-500/20 rounded-2xl p-6 border border-white/10">
                    <Zap className="w-8 h-8 text-orange-400 mb-4" />
                    <div className="text-2xl font-bold text-white">24/7</div>
                    <div className="text-slate-300">Support</div>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-8">
                Built for
                <span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent block">
                  Excellence & Growth
                </span>
              </h2>
              <p className="text-xl text-slate-300 mb-8 leading-relaxed">
                Our platform scales seamlessly with Pallisa High School's vision, 
                supporting unlimited growth while maintaining premium educational standards.
              </p>
              
              <div className="space-y-4 mb-8">
                {[
                  "Unlimited student and teacher profiles with AI insights",
                  "Multi-stream support with intelligent resource allocation", 
                  "Advanced predictive analytics for academic excellence",
                  "Enterprise-grade security with privacy compliance"
                ].map((item, index) => (
                  <div key={index} className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full mt-3 flex-shrink-0"></div>
                    <span className="text-slate-300">{item}</span>
                  </div>
                ))}
              </div>

              <Link href="/auth/register" className="px-8 py-4 bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-full font-semibold hover:from-emerald-600 hover:to-cyan-600 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center">
                Start Your Journey
                <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 px-6">
        <div className="container mx-auto">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-3xl blur-3xl"></div>
            <div className="relative bg-gradient-to-br from-slate-800/80 to-slate-900/80 rounded-3xl p-12 backdrop-blur-xl border border-white/10 text-center">
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
                Ready to
                <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent block">
                  Transform Education?
                </span>
              </h2>
              <p className="text-xl text-slate-300 mb-10 max-w-3xl mx-auto">
                Join the digital revolution at Pallisa High School. Experience the future of 
                education management with cutting-edge technology and unparalleled support.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/dashboard" className="px-10 py-4 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full font-bold text-lg hover:from-blue-600 hover:to-purple-600 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-2xl">
                  Access School Portal
                  <ArrowRight className="ml-2 w-5 h-5 inline" />
                </Link>
                <Link href="/demo" className="px-10 py-4 border border-white/20 rounded-full font-semibold text-lg hover:bg-white/10 transition-all duration-300">
                  Schedule Demo
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 py-12 px-6">
        <div className="container mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <Link href="/" className="flex items-center space-x-3 mb-6 md:mb-0">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-500 rounded-xl flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                PALLISA
              </span>
            </Link>
            
            <div className="flex space-x-8 mb-6 md:mb-0">
              <Link href="/privacy" className="text-slate-400 hover:text-white transition-colors">Privacy Policy</Link>
              <Link href="/terms" className="text-slate-400 hover:text-white transition-colors">Terms of Service</Link>
              <Link href="/contact" className="text-slate-400 hover:text-white transition-colors">Contact</Link>
            </div>
            
            <p className="text-slate-400">
              © 2025 Pallisa High School. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}