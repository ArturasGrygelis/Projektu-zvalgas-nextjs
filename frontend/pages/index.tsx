import Link from 'next/link';
import Head from 'next/head';
import Image from 'next/image';
import { FaBriefcase, FaBalanceScale, FaChartLine, FaCheck, FaStar } from 'react-icons/fa';

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      <Head>
        <title>Mano BŪSTAS | Būsto priežiūros asistentas</title>
        <meta name="description" content="Mano BŪSTAS - jūsų pagalbininkas būsto priežiūros ir teisiniuose klausimuose." />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <header className="bg-white shadow-sm py-4 sticky top-0 z-10">
        <div className="container mx-auto px-4 flex justify-between items-center">
          <div className="flex items-center">
            {/* Logo */}
            <h1 className="text-xl font-bold">
              <span className="text-[#8bc53f]">Mano</span>
              <span className="text-[#1a365d]">BŪSTAS</span>
            </h1>
          </div>
          
          {/* Search bar */}
          <div className="hidden md:block">
            <div className="relative">
              <input 
                type="text" 
                placeholder="Kas Jus domina?" 
                className="bg-gray-100 rounded-full py-2 px-4 w-64"
              />
            </div>
          </div>
          
          <nav>
            <ul className="flex space-x-6">
              
              <li>
                <Link href="/chat" className="bg-[#8bc53f] text-white px-5 py-2 rounded-full hover:bg-[#79af32] transition shadow-md font-medium">
                  Virtualus Pagalbininkas
                </Link>
              </li>
            </ul>
          </nav>
        </div>
      </header>

      <main>
        {/* Hero Section */}
        <section className="py-20 bg-white text-[#1a365d]">
          <div className="container mx-auto px-4 flex flex-col md:flex-row items-center">
            <div className="md:w-1/2 mb-10 md:mb-0">
              <h1 className="text-4xl md:text-5xl font-bold mb-6 leading-tight text-[#1a365d]">
                Mes pasirūpinsime Jūsų namais!
              </h1>
              <p className="text-xl mb-8 text-gray-700">
                Norite ramiai leisti laiką su artimaisiais, skaityti knygą, stebėti varžybas ar užsiimti kita mėgstama veikla? Pasirinkite „Mano BŪSTAS" ir galėsite būti ramūs dėl savo būsto ateities!
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/chat" className="bg-[#8bc53f] text-white px-8 py-3 rounded-full hover:bg-[#79af32] transition font-medium text-center shadow-lg">
                  Sužinoti daugiau
                </Link>
              </div>
            </div>
            <div className="md:w-1/2 flex justify-center">
              <div className="relative w-full max-w-md">
                <Image 
                  src="/building-illustration.png" 
                  alt="Būsto priežiūra" 
                  width={500} 
                  height={400}
                  className="object-contain"
                  onError={(e) => {
                    // Fallback if image doesn't exist
                    e.currentTarget.style.display = 'none';
                  }}
                />
              </div>
            </div>
          </div>
        </section>

        {/* Features section */}
        <section id="features" className="py-20 bg-gray-50">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-[#1a365d] mb-2">Mūsų paslaugos</h2>
              <p className="text-lg text-gray-600 mt-4 max-w-2xl mx-auto">Kompleksinės paslaugos jūsų namų priežiūrai ir komfortui</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
              <div className="bg-white p-8 rounded-lg shadow-md hover:shadow-lg transition border border-gray-100">
                <div className="bg-[#8bc53f] w-14 h-14 rounded-full flex items-center justify-center text-white mb-6 shadow-md">
                  <FaBriefcase className="text-2xl" />
                </div>
                <h3 className="text-xl font-bold mb-4 text-[#1a365d]">Avarinė tarnyba</h3>
                <p className="text-gray-600">Skubi pagalba jūsų namų avarinėse situacijose. Mūsų komanda pasiruošusi padėti bet kuriuo metu.</p>
                <ul className="mt-4 space-y-2">
                  <li className="flex items-center text-gray-700">
                    <FaCheck className="text-[#8bc53f] mr-2 flex-shrink-0" />
                    <span>Skubus reagavimas</span>
                  </li>
                  <li className="flex items-center text-gray-700">
                    <FaCheck className="text-[#8bc53f] mr-2 flex-shrink-0" />
                    <span>Profesionalus sprendimas</span>
                  </li>
                  <li className="flex items-center text-gray-700">
                    <FaCheck className="text-[#8bc53f] mr-2 flex-shrink-0" />
                    <span>24/7 paslauga</span>
                  </li>
                </ul>
              </div>
              
              <div className="bg-white p-8 rounded-lg shadow-md hover:shadow-lg transition border border-gray-100">
                <div className="bg-[#8bc53f] w-14 h-14 rounded-full flex items-center justify-center text-white mb-6 shadow-md">
                  <FaBalanceScale className="text-2xl" />
                </div>
                <h3 className="text-xl font-bold mb-4 text-[#1a365d]">Valymo darbai</h3>
                <p className="text-gray-600">Kokybiškas patalpų valymas ir priežiūra, užtikrinant švarą ir tvarką jūsų aplinkoje.</p>
                <ul className="mt-4 space-y-2">
                  <li className="flex items-center text-gray-700">
                    <FaCheck className="text-[#8bc53f] mr-2 flex-shrink-0" />
                    <span>Bendro naudojimo patalpos</span>
                  </li>
                  <li className="flex items-center text-gray-700">
                    <FaCheck className="text-[#8bc53f] mr-2 flex-shrink-0" />
                    <span>Aplinkos tvarkymas</span>
                  </li>
                  <li className="flex items-center text-gray-700">
                    <FaCheck className="text-[#8bc53f] mr-2 flex-shrink-0" />
                    <span>Specialūs valymo darbai</span>
                  </li>
                </ul>
              </div>
              
              <div className="bg-white p-8 rounded-lg shadow-md hover:shadow-lg transition border border-gray-100">
                <div className="bg-[#8bc53f] w-14 h-14 rounded-full flex items-center justify-center text-white mb-6 shadow-md">
                  <FaChartLine className="text-2xl" />
                </div>
                <h3 className="text-xl font-bold mb-4 text-[#1a365d]">Būsto priežiūra</h3>
                <p className="text-gray-600">Kompleksinė jūsų namų ir aplinkos priežiūra, užtikrinanti ilgalaikį komfortą.</p>
                <ul className="mt-4 space-y-2">
                  <li className="flex items-center text-gray-700">
                    <FaCheck className="text-[#8bc53f] mr-2 flex-shrink-0" />
                    <span>Techninė priežiūra</span>
                  </li>
                  <li className="flex items-center text-gray-700">
                    <FaCheck className="text-[#8bc53f] mr-2 flex-shrink-0" />
                    <span>Inžinerinių sistemų aptarnavimas</span>
                  </li>
                  <li className="flex items-center text-gray-700">
                    <FaCheck className="text-[#8bc53f] mr-2 flex-shrink-0" />
                    <span>Sezoniniai darbai</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>
        
        {/* Testimonials */}
        <section className="py-20 bg-white">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-[#1a365d]">Klientų atsiliepimai</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition border border-gray-100">
                <div className="flex text-yellow-400 mb-3">
                  <FaStar /><FaStar /><FaStar /><FaStar /><FaStar />
                </div>
                <p className="text-gray-700 mb-4">"Mano BŪSTAS komanda labai operatyviai išsprendė vandens nuotėkio problemą. Profesionalus aptarnavimas ir puikus rezultatas."</p>
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-[#8bc53f] rounded-full mr-3 shadow"></div>
                  <div>
                    <h4 className="font-medium">Laura K.</h4>
                    <p className="text-sm text-gray-500">Vilnius</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition border border-gray-100">
                <div className="flex text-yellow-400 mb-3">
                  <FaStar /><FaStar /><FaStar /><FaStar /><FaStar />
                </div>
                <p className="text-gray-700 mb-4">"Patiko, kad visas būsto priežiūros paslaugas gaunu iš vienų rankų. Rekomenduoju visiems, kas vertina kokybę ir patikimumą."</p>
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-[#8bc53f] rounded-full mr-3 shadow"></div>
                  <div>
                    <h4 className="font-medium">Tomas J.</h4>
                    <p className="text-sm text-gray-500">Kaunas</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition border border-gray-100">
                <div className="flex text-yellow-400 mb-3">
                  <FaStar /><FaStar /><FaStar /><FaStar /><FaStar />
                </div>
                <p className="text-gray-700 mb-4">"Bendras patalpų valymas vykdomas puikiai, laiptinės visada švarios. Administravimo mokestis tikrai atitinka gaunamų paslaugų kokybę."</p>
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-[#8bc53f] rounded-full mr-3 shadow"></div>
                  <div>
                    <h4 className="font-medium">Greta B.</h4>
                    <p className="text-sm text-gray-500">Klaipėda</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
        
        {/* CTA Section */}
        <section className="py-16 bg-[#8bc53f] text-white">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold mb-6">Pasiruošę pradėti?</h2>
            <p className="text-xl mb-8 max-w-2xl mx-auto">
              Susisiekite su mumis jau šiandien ir užtikrinkite profesionalią savo būsto priežiūrą.
            </p>
            <Link href="/chat" className="inline-block bg-white text-[#1a365d] px-8 py-3 rounded-full hover:bg-gray-100 transition font-medium shadow-lg">
              Sužinoti daugiau
            </Link>
          </div>
        </section>
      </main>
      
      <footer className="bg-[#1a365d] text-gray-400 py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <h3 className="text-white text-lg font-semibold mb-4">Mano BŪSTAS</h3>
              <p className="mb-4">Jūsų patikimas būsto priežiūros partneris.</p>
            </div>
            <div>
              <h4 className="text-white text-lg font-semibold mb-4">Paslaugos</h4>
              <ul className="space-y-2">
                <li><a href="#" className="hover:text-[#8bc53f] transition">Avarinė tarnyba</a></li>
                <li><a href="#" className="hover:text-[#8bc53f] transition">Valymo darbai</a></li>
                <li><a href="#" className="hover:text-[#8bc53f] transition">Būsto priežiūra</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white text-lg font-semibold mb-4">Informacija</h4>
              <ul className="space-y-2">
                <li><a href="#" className="hover:text-[#8bc53f] transition">Naujienos</a></li>
                <li><a href="#" className="hover:text-[#8bc53f] transition">DUK</a></li>
                <li><a href="#" className="hover:text-[#8bc53f] transition">Kontaktai</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white text-lg font-semibold mb-4">Teisinė informacija</h4>
              <ul className="space-y-2">
                <li><a href="#" className="hover:text-[#8bc53f] transition">Privatumo politika</a></li>
                <li><a href="#" className="hover:text-[#8bc53f] transition">Sutarties sąlygos</a></li>
                <li><a href="#" className="hover:text-[#8bc53f] transition">Slapukai</a></li>
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t border-gray-800 text-center">
            <p>© {new Date().getFullYear()} Mano BŪSTAS. Visos teisės saugomos.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}