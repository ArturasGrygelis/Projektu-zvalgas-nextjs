import Link from 'next/link';
import Head from 'next/head';
import Image from 'next/image';
import { FaBriefcase, FaBalanceScale, FaChartLine, FaCheck, FaStar } from 'react-icons/fa';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
      <Head>
        <title>Darbo Asistentas | Lithuanian Work Law AI Assistant</title>
        <meta name="description" content="Your AI assistant for Lithuanian labor law and work-related queries. Get instant, accurate answers to your employment questions." />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <header className="bg-white shadow-md py-4 sticky top-0 z-10">
        <div className="container mx-auto px-4 flex justify-between items-center">
          <div className="flex items-center">
            {/* Logo with gradient */}
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-lg mr-3 flex items-center justify-center text-white font-bold text-xl shadow-md">
              DA
            </div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-indigo-700 to-purple-700 bg-clip-text text-transparent">Darbo Asistentas</h1>
          </div>
          <nav>
            <ul className="flex space-x-6">
              <li><a href="#features" className="text-gray-700 hover:text-indigo-600 transition font-medium">Features</a></li>
              <li><a href="#pricing" className="text-gray-700 hover:text-indigo-600 transition font-medium">Pricing</a></li>
              <li>
                <Link href="/chat" className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-5 py-2 rounded-lg hover:from-indigo-700 hover:to-purple-700 transition shadow-md font-medium">
                  Start Chatting
                </Link>
              </li>
            </ul>
          </nav>
        </div>
      </header>

      <main>
        {/* Hero Section with more vibrant gradient */}
        <section className="py-20 bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 text-white">
          <div className="container mx-auto px-4 flex flex-col md:flex-row items-center">
            <div className="md:w-1/2 mb-10 md:mb-0">
              <h1 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">
                Your Lithuanian Labor Law Assistant Powered by AI
              </h1>
              <p className="text-xl mb-8 text-indigo-100">
                Get instant answers to your work-related questions and professional guidance on Lithuanian employment law.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/chat" className="bg-white text-indigo-700 px-8 py-3 rounded-lg hover:bg-gray-100 transition font-medium text-center shadow-lg transform hover:scale-105 duration-200">
                  Start Chatting Now
                </Link>
                <a 
                  href="#pricing" 
                  className="bg-indigo-800/50 backdrop-blur-sm text-white border border-indigo-400 px-8 py-3 rounded-lg hover:bg-indigo-700 transition font-medium text-center shadow-md transform hover:scale-105 duration-200"
                >
                  View Pricing
                </a>
              </div>
            </div>
            <div className="md:w-1/2 flex justify-center">
              {/* Enhanced chat illustration with glass morphism */}
              <div className="relative w-full max-w-md h-80 bg-white/20 backdrop-blur-xl rounded-xl shadow-2xl overflow-hidden border border-white/30">
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-400 to-purple-500 opacity-10"></div>
                <div className="p-6 relative z-10 flex flex-col h-full">
                  <div className="mb-3 flex items-center">
                    <div className="w-9 h-9 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 mr-3 shadow-md">
                      <FaBalanceScale className="text-lg" />
                    </div>
                    <h3 className="font-semibold text-white drop-shadow-md">Lithuanian Labor Law Assistant</h3>
                  </div>
                  <div className="bg-white/90 flex-grow rounded-lg p-4 border border-white/60 shadow-inner">
                    <div className="flex mb-4">
                      <div className="bg-gray-200 rounded-full p-2 mr-3 shadow-sm">
                        <span className="sr-only">User</span>
                      </div>
                      <div className="bg-gray-200 rounded-lg py-2 px-3 max-w-xs shadow-sm">
                        What are my rights if my employer wants to change my working hours?
                      </div>
                    </div>
                    <div className="flex justify-end">
                      <div className="bg-indigo-100 text-indigo-800 rounded-lg py-2 px-3 max-w-xs shadow-sm">
                        According to Lithuanian Labor Code Article 120, your employer must notify you about changes to working time at least 5 working days in advance...
                      </div>
                      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full p-2 ml-3 shadow-sm">
                        <span className="sr-only">Assistant</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features section with improved cards */}
        <section id="features" className="py-20 bg-white">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <span className="inline-block py-1 px-4 rounded-full bg-indigo-100 text-indigo-800 text-sm font-medium mb-3 shadow-sm">FEATURES</span>
              <h2 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-indigo-700 to-purple-700 bg-clip-text text-transparent mb-2">How Darbo Asistentas Helps You</h2>
              <p className="text-lg text-gray-600 mt-4 max-w-2xl mx-auto">Get accurate information and guidance on all your work-related questions in Lithuania</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
              <div className="bg-white p-8 rounded-xl shadow-lg hover:shadow-xl transition border border-gray-100 transform hover:-translate-y-1 duration-200">
                <div className="bg-gradient-to-br from-indigo-500 to-purple-500 w-14 h-14 rounded-full flex items-center justify-center text-white mb-6 shadow-md">
                  <FaBriefcase className="text-2xl" />
                </div>
                <h3 className="text-xl font-bold mb-4 text-gray-900">Work Rights Guidance</h3>
                <p className="text-gray-600">Get accurate answers to your work-related questions based on current Lithuanian labor laws and professional guidance.</p>
                <ul className="mt-4 space-y-2">
                  <li className="flex items-center text-gray-700">
                    <FaCheck className="text-green-500 mr-2 flex-shrink-0" />
                    <span>Vacation and time off</span>
                  </li>
                  <li className="flex items-center text-gray-700">
                    <FaCheck className="text-green-500 mr-2 flex-shrink-0" />
                    <span>Compensation and benefits</span>
                  </li>
                  <li className="flex items-center text-gray-700">
                    <FaCheck className="text-green-500 mr-2 flex-shrink-0" />
                    <span>Working conditions</span>
                  </li>
                </ul>
              </div>
              
              <div className="bg-white p-8 rounded-xl shadow-lg hover:shadow-xl transition border border-gray-100 transform hover:-translate-y-1 duration-200">
                <div className="bg-gradient-to-br from-indigo-500 to-purple-500 w-14 h-14 rounded-full flex items-center justify-center text-white mb-6 shadow-md">
                  <FaBalanceScale className="text-2xl" />
                </div>
                <h3 className="text-xl font-bold mb-4 text-gray-900">Legal Knowledge</h3>
                <p className="text-gray-600">Access employment law information and stay compliant with Lithuanian labor regulations and requirements.</p>
                <ul className="mt-4 space-y-2">
                  <li className="flex items-center text-gray-700">
                    <FaCheck className="text-green-500 mr-2 flex-shrink-0" />
                    <span>Contract explanations</span>
                  </li>
                  <li className="flex items-center text-gray-700">
                    <FaCheck className="text-green-500 mr-2 flex-shrink-0" />
                    <span>Workplace rights</span>
                  </li>
                  <li className="flex items-center text-gray-700">
                    <FaCheck className="text-green-500 mr-2 flex-shrink-0" />
                    <span>Termination procedures</span>
                  </li>
                </ul>
              </div>
              
              <div className="bg-white p-8 rounded-xl shadow-lg hover:shadow-xl transition border border-gray-100 transform hover:-translate-y-1 duration-200">
                <div className="bg-gradient-to-br from-indigo-500 to-purple-500 w-14 h-14 rounded-full flex items-center justify-center text-white mb-6 shadow-md">
                  <FaChartLine className="text-2xl" />
                </div>
                <h3 className="text-xl font-bold mb-4 text-gray-900">Career Development</h3>
                <p className="text-gray-600">Receive advice on career growth, skill development and effective workplace solutions in Lithuania.</p>
                <ul className="mt-4 space-y-2">
                  <li className="flex items-center text-gray-700">
                    <FaCheck className="text-green-500 mr-2 flex-shrink-0" />
                    <span>Advancement strategies</span>
                  </li>
                  <li className="flex items-center text-gray-700">
                    <FaCheck className="text-green-500 mr-2 flex-shrink-0" />
                    <span>Workplace conflict</span>
                  </li>
                  <li className="flex items-center text-gray-700">
                    <FaCheck className="text-green-500 mr-2 flex-shrink-0" />
                    <span>Performance improvement</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>
        
        {/* Testimonials with enhanced card design */}
        <section className="py-20 bg-gradient-to-b from-slate-50 to-white">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <span className="inline-block py-1 px-4 rounded-full bg-indigo-100 text-indigo-800 text-sm font-medium mb-3 shadow-sm">TESTIMONIALS</span>
              <h2 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-indigo-700 to-purple-700 bg-clip-text text-transparent">What Our Users Say</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition border border-gray-100">
                <div className="flex text-yellow-400 mb-3">
                  <FaStar /><FaStar /><FaStar /><FaStar /><FaStar />
                </div>
                <p className="text-gray-700 mb-4">"Darbo Asistentas helped me understand my rights when my position was being restructured. The advice was clear and accurate."</p>
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full mr-3 shadow"></div>
                  <div>
                    <h4 className="font-medium">Laura K.</h4>
                    <p className="text-sm text-gray-500">Marketing Specialist</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition border border-gray-100">
                <div className="flex text-yellow-400 mb-3">
                  <FaStar /><FaStar /><FaStar /><FaStar /><FaStar />
                </div>
                <p className="text-gray-700 mb-4">"As an HR manager, I use this tool regularly to quickly check Lithuanian labor law details. It saves me hours of research time."</p>
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full mr-3 shadow"></div>
                  <div>
                    <h4 className="font-medium">Tomas J.</h4>
                    <p className="text-sm text-gray-500">HR Director</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition border border-gray-100">
                <div className="flex text-yellow-400 mb-3">
                  <FaStar /><FaStar /><FaStar /><FaStar /><FaStar />
                </div>
                <p className="text-gray-700 mb-4">"I had questions about my maternity leave rights and got detailed, helpful information that helped me plan ahead with confidence."</p>
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full mr-3 shadow"></div>
                  <div>
                    <h4 className="font-medium">Greta B.</h4>
                    <p className="text-sm text-gray-500">Project Manager</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
        
        {/* Pricing section with modern card design */}
        <section id="pricing" className="py-20 bg-white">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <span className="inline-block py-1 px-4 rounded-full bg-indigo-100 text-indigo-800 text-sm font-medium mb-3 shadow-sm">PRICING</span>
              <h2 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-indigo-700 to-purple-700 bg-clip-text text-transparent">Choose Your Plan</h2>
              <p className="text-lg text-gray-600 mt-4 max-w-2xl mx-auto">Flexible options designed to suit your needs</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-200 hover:shadow-xl transition transform hover:-translate-y-1 duration-200">
                <div className="text-center mb-6">
                  <h3 className="text-xl font-bold mb-2">Free</h3>
                  <p className="text-4xl font-bold mb-1">€0<span className="text-lg font-normal text-gray-500">/month</span></p>
                  <p className="text-gray-500">Basic features for individuals</p>
                </div>
                <ul className="mb-8 space-y-3">
                  <li className="flex items-center text-gray-700">
                    <FaCheck className="text-green-500 mr-3 flex-shrink-0" />
                    <span>Basic work information</span>
                  </li>
                  <li className="flex items-center text-gray-700">
                    <FaCheck className="text-green-500 mr-3 flex-shrink-0" />
                    <span>50 messages per day</span>
                  </li>
                  <li className="flex items-center text-gray-700">
                    <FaCheck className="text-green-500 mr-3 flex-shrink-0" />
                    <span>Standard response time</span>
                  </li>
                </ul>
                <Link href="/chat" className="block w-full text-center bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium py-3 rounded-lg transition shadow-md hover:shadow-lg">
                  Get Started
                </Link>
              </div>
              
              <div className="bg-white p-8 rounded-xl shadow-xl border-2 border-indigo-500 relative transform hover:-translate-y-2 hover:shadow-2xl transition duration-300">
                <div className="absolute top-0 right-0 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-xs font-bold uppercase py-1 px-3 transform translate-x-2 -translate-y-2 rounded shadow-md">Popular</div>
                <div className="text-center mb-6">
                  <h3 className="text-xl font-bold mb-2">Professional</h3>
                  <p className="text-4xl font-bold mb-1">€9.99<span className="text-lg font-normal text-gray-500">/month</span></p>
                  <p className="text-gray-500">Advanced features for professionals</p>
                </div>
                <ul className="mb-8 space-y-3">
                  <li className="flex items-center text-gray-700">
                    <FaCheck className="text-green-500 mr-3 flex-shrink-0" />
                    <span>Advanced work guidance</span>
                  </li>
                  <li className="flex items-center text-gray-700">
                    <FaCheck className="text-green-500 mr-3 flex-shrink-0" />
                    <span>Unlimited messages</span>
                  </li>
                  <li className="flex items-center text-gray-700">
                    <FaCheck className="text-green-500 mr-3 flex-shrink-0" />
                    <span>Priority response</span>
                  </li>
                  <li className="flex items-center text-gray-700">
                    <FaCheck className="text-green-500 mr-3 flex-shrink-0" />
                    <span>Document analysis</span>
                  </li>
                </ul>
                <Link href="/chat" className="block w-full text-center bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-medium py-3 rounded-lg transition shadow-md hover:shadow-lg">
                  Subscribe Now
                </Link>
              </div>
              
              <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-200 hover:shadow-xl transition transform hover:-translate-y-1 duration-200">
                <div className="text-center mb-6">
                  <h3 className="text-xl font-bold mb-2">Enterprise</h3>
                  <p className="text-4xl font-bold mb-1">Custom</p>
                  <p className="text-gray-500">Tailored solutions for teams</p>
                </div>
                <ul className="mb-8 space-y-3">
                  <li className="flex items-center text-gray-700">
                    <FaCheck className="text-green-500 mr-3 flex-shrink-0" />
                    <span>Custom workplace solutions</span>
                  </li>
                  <li className="flex items-center text-gray-700">
                    <FaCheck className="text-green-500 mr-3 flex-shrink-0" />
                    <span>Team accounts</span>
                  </li>
                  <li className="flex items-center text-gray-700">
                    <FaCheck className="text-green-500 mr-3 flex-shrink-0" />
                    <span>API access</span>
                  </li>
                  <li className="flex items-center text-gray-700">
                    <FaCheck className="text-green-500 mr-3 flex-shrink-0" />
                    <span>Dedicated support</span>
                  </li>
                </ul>
                <a href="mailto:contact@darboasistentas.lt" className="block w-full text-center bg-gray-800 hover:bg-gray-900 text-white font-medium py-3 rounded-lg transition shadow-md hover:shadow-lg">
                  Contact Sales
                </a>
              </div>
            </div>
          </div>
        </section>
        
        {/* CTA Section with vibrant gradient */}
        <section className="py-16 bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 text-white">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold mb-6">Ready to get started?</h2>
            <p className="text-xl text-indigo-100 mb-8 max-w-2xl mx-auto">
              Start using Darbo Asistentas today and get expert answers to all your Lithuanian labor law questions.
            </p>
            <Link href="/chat" className="inline-block bg-white text-indigo-700 px-8 py-3 rounded-lg hover:bg-gray-100 transition font-medium shadow-lg transform hover:scale-105 duration-200">
              Try It For Free
            </Link>
          </div>
        </section>
      </main>
      
      <footer className="bg-gray-900 text-gray-400 py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <h3 className="text-white text-lg font-semibold mb-4">Darbo Asistentas</h3>
              <p className="mb-4">Your Lithuanian labor law assistant powered by AI.</p>
              <div className="flex space-x-4">
                {/* Social media icons would go here */}
              </div>
            </div>
            <div>
              <h4 className="text-white text-lg font-semibold mb-4">Features</h4>
              <ul className="space-y-2">
                <li><a href="#" className="hover:text-indigo-400 transition">Work Guidance</a></li>
                <li><a href="#" className="hover:text-indigo-400 transition">Legal Knowledge</a></li>
                <li><a href="#" className="hover:text-indigo-400 transition">Career Development</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white text-lg font-semibold mb-4">Resources</h4>
              <ul className="space-y-2">
                <li><a href="#" className="hover:text-indigo-400 transition">Blog</a></li>
                <li><a href="#" className="hover:text-indigo-400 transition">Help Center</a></li>
                <li><a href="#" className="hover:text-indigo-400 transition">Contact</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white text-lg font-semibold mb-4">Legal</h4>
              <ul className="space-y-2">
                <li><a href="#" className="hover:text-indigo-400 transition">Terms of Service</a></li>
                <li><a href="#" className="hover:text-indigo-400 transition">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-indigo-400 transition">Cookies</a></li>
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t border-gray-800 text-center">
            <p>© {new Date().getFullYear()} Darbo Asistentas. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}