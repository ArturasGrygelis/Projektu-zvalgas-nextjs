import Link from 'next/link';
import Head from 'next/head';

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-100">
      <Head>
        <title>Darbo Asistentas</title>
        <meta name="description" content="Your AI Assistant for work-related queries" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="container mx-auto px-4 py-16">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-6">Darbo Asistentas</h1>
          <p className="text-xl mb-10">Your intelligent work assistant powered by AI</p>
          
          <div className="flex justify-center gap-4">
            <Link href="/chat">
              <a className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition">
                Start Chatting
              </a>
            </Link>
            <a 
              href="#pricing" 
              className="bg-gray-200 text-gray-800 px-6 py-3 rounded-lg hover:bg-gray-300 transition"
            >
              View Pricing
            </a>
          </div>
        </div>
        
        {/* Features section */}
        <section className="mt-20">
          <h2 className="text-3xl font-bold text-center mb-12">Features</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-xl font-semibold mb-4">Work Guidance</h3>
              <p>Get accurate answers to your work-related questions and professional guidance.</p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-xl font-semibold mb-4">Legal Knowledge</h3>
              <p>Access employment law information and stay compliant with regulations.</p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-xl font-semibold mb-4">Career Development</h3>
              <p>Receive advice on career growth, skill development and workplace solutions.</p>
            </div>
          </div>
        </section>
        
        {/* Pricing section */}
        <section id="pricing" className="mt-20">
          <h2 className="text-3xl font-bold text-center mb-12">Pricing Plans</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-lg shadow-md text-center">
              <h3 className="text-xl font-semibold mb-2">Free</h3>
              <p className="text-3xl font-bold mb-6">$0<span className="text-sm font-normal">/month</span></p>
              <ul className="mb-6 text-left">
                <li className="mb-2">✓ Basic work information</li>
                <li className="mb-2">✓ 50 messages per day</li>
                <li className="mb-2">✓ Standard response time</li>
              </ul>
              <button className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition">
                Get Started
              </button>
            </div>
            
            <div className="bg-blue-50 p-6 rounded-lg shadow-md text-center border-2 border-blue-600">
              <h3 className="text-xl font-semibold mb-2">Professional</h3>
              <p className="text-3xl font-bold mb-6">$9.99<span className="text-sm font-normal">/month</span></p>
              <ul className="mb-6 text-left">
                <li className="mb-2">✓ Advanced work guidance</li>
                <li className="mb-2">✓ Unlimited messages</li>
                <li className="mb-2">✓ Priority response</li>
                <li className="mb-2">✓ Document analysis</li>
              </ul>
              <button className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition">
                Subscribe Now
              </button>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-md text-center">
              <h3 className="text-xl font-semibold mb-2">Enterprise</h3>
              <p className="text-3xl font-bold mb-6">Contact Us</p>
              <ul className="mb-6 text-left">
                <li className="mb-2">✓ Custom workplace solutions</li>
                <li className="mb-2">✓ Team accounts</li>
                <li className="mb-2">✓ API access</li>
                <li className="mb-2">✓ Dedicated support</li>
              </ul>
              <button className="w-full bg-gray-800 text-white py-2 rounded hover:bg-gray-900 transition">
                Contact Sales
              </button>
            </div>
          </div>
        </section>
      </main>
      
      <footer className="bg-gray-800 text-white py-8 mt-20">
        <div className="container mx-auto px-4 text-center">
          <p>© {new Date().getFullYear()} Darbo Asistentas. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}