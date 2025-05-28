import Link from 'next/link';
import Head from 'next/head';
import Image from 'next/image';
import { FaSearch, FaFilter, FaChartLine, FaCheck, FaStar, FaBriefcase, FaBuilding, FaRoad, FaUsers, FaBell, FaLightbulb, FaFileAlt, FaChartBar, FaShieldAlt } from 'react-icons/fa';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#F5F7FA] via-white to-[#F5F7FA]">
      <Head>
        <title>PROJEKTŲ ŽVALGAS | Konkursų paieškos platforma</title>
        <meta name="description" content="Projektų žvalgas - jūsų pagalbininkas aktyvių ir aktualių konkursų paieškai statybos, lauko darbų ir kitų projektų vykdymui." />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <header className="bg-[#1A3A5E] shadow-sm py-4 sticky top-0 z-10">
        <div className="container mx-auto px-4 flex justify-between items-center">
          <div className="flex items-center">
            {/* Logo */}
            <h1 className="text-xl font-bold">
              <span className="text-[#FFB703]">PROJEKTŲ</span>
              <span className="text-white"> ŽVALGAS</span>
            </h1>
          </div>
          
          <nav>
            <ul className="flex space-x-6">
              <li>
                <Link href="/chat" className="bg-[#F4A261] text-[#1A3A5E] px-5 py-2 rounded-full hover:bg-[#FFB703] transition shadow-md font-medium">
                  Virtualus Asistentas
                </Link>
              </li>
            </ul>
          </nav>
        </div>
      </header>

      <main>
        {/* Hero Section */}
        <section className="py-20 bg-gradient-to-r from-[#F5F7FA] to-white text-[#1A3A5E]">
          <div className="container mx-auto px-4 flex flex-col md:flex-row items-center">
            <div className="md:w-1/2 mb-10 md:mb-0">
              <h1 className="text-4xl md:text-5xl font-bold mb-6 leading-tight text-[#1A3A5E]">
                Raskite tinkamiausius konkursus savo verslui!
              </h1>
              <p className="text-xl mb-8 text-gray-700">
                Projektų Žvalgas — tai internetinė platforma, padedanti įmonėms ir specialistams atrasti aktyvius ir aktualius konkursus statybos, lauko darbų ir kitų projektų vykdymui.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/chat" className="bg-[#F4A261] text-[#1A3A5E] px-8 py-3 rounded-full hover:bg-[#FFB703] transition font-medium text-center shadow-lg">
                  Rasti konkursus
                </Link>
              </div>
            </div>
            <div className="md:w-1/2 flex justify-center">
              <div className="relative w-full max-w-md">
                <div className="bg-gradient-to-br from-[#E6EFF6] to-[#C9D8E5] h-96 w-full rounded-lg flex items-center justify-center shadow-lg">
                  <div className="text-center">
                    <h2 className="font-bold text-2xl mb-2">
                      <span className="text-[#FFB703]">Projektų</span>
                      <span className="text-[#1A3A5E]"> ŽVALGAS</span>
                    </h2>
                    <span className="text-[#1A3A5E] text-xl">Pagalbininkas</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features section */}
        <section id="features" className="py-20 bg-gradient-to-b from-white to-[#F5F7FA]">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-[#1A3A5E] mb-2">Mūsų privalumai</h2>
              <p className="text-lg text-gray-600 mt-4 max-w-2xl mx-auto">Sistema analizuoja, filtruoja ir pateikia labiausiai tinkamus bei šiuo metu galiojančius konkursus pagal jūsų poreikius</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
              <div className="bg-white p-8 rounded-lg shadow-md hover:shadow-lg transition border border-gray-100">
                <div className="bg-[#2D6A4F] w-14 h-14 rounded-full flex items-center justify-center text-white mb-6 shadow-md">
                  <FaSearch className="text-2xl" />
                </div>
                <h3 className="text-xl font-bold mb-4 text-[#1A3A5E]">Išmani paieška</h3>
                <p className="text-gray-600">Pažangi paieškos sistema, padedanti rasti tinkamiausius konkursus pagal jūsų veiklos sritį ir pajėgumus.</p>
              </div>
              
              <div className="bg-white p-8 rounded-lg shadow-md hover:shadow-lg transition border border-gray-100">
                <div className="bg-[#2D6A4F] w-14 h-14 rounded-full flex items-center justify-center text-white mb-6 shadow-md">
                  <FaFilter className="text-2xl" />
                </div>
                <h3 className="text-xl font-bold mb-4 text-[#1A3A5E]">Konkursų filtravimas</h3>
                <p className="text-gray-600">Pažangūs filtrai, leidžiantys greitai atrasti būtent jums aktualius ir tinkamus konkursus.</p>
              </div>
              
              <div className="bg-white p-8 rounded-lg shadow-md hover:shadow-lg transition border border-gray-100">
                <div className="bg-[#2D6A4F] w-14 h-14 rounded-full flex items-center justify-center text-white mb-6 shadow-md">
                  <FaChartLine className="text-2xl" />
                </div>
                <h3 className="text-xl font-bold mb-4 text-[#1A3A5E]">Verslo galimybės</h3>
                <p className="text-gray-600">Didesnis konkursų pasirinkimas reiškia daugiau galimybių jūsų verslui augti ir plėstis.</p>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section className="py-20 bg-white">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-[#1A3A5E] mb-2">Kaip tai veikia</h2>
              <p className="text-lg text-gray-600 mt-4 max-w-2xl mx-auto">Paprastas procesas, padedantis efektyviai surasti ir dalyvauti konkursuose</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              <div className="text-center">
                <div className="bg-[#E6EFF6] w-16 h-16 rounded-full flex items-center justify-center text-[#1A3A5E] mx-auto mb-4 text-2xl font-bold shadow-md">1</div>
                <h3 className="text-lg font-bold mb-2 text-[#1A3A5E]">Prisijungimas</h3>
                <p className="text-gray-600">Prieiga prie konkursų duombazės su išsamia konkursų informacija ir dokumentais.</p>
              </div>
              
              <div className="text-center">
                <div className="bg-[#E6EFF6] w-16 h-16 rounded-full flex items-center justify-center text-[#1A3A5E] mx-auto mb-4 text-2xl font-bold shadow-md">2</div>
                <h3 className="text-lg font-bold mb-2 text-[#1A3A5E]">Paieška</h3>
                <p className="text-gray-600">Naudokite pažangius filtrus pagal regioną, vertę, tipą ir kitus parametrus.</p>
              </div>
              
              <div className="text-center">
                <div className="bg-[#E6EFF6] w-16 h-16 rounded-full flex items-center justify-center text-[#1A3A5E] mx-auto mb-4 text-2xl font-bold shadow-md">3</div>
                <h3 className="text-lg font-bold mb-2 text-[#1A3A5E]">Analizė</h3>
                <p className="text-gray-600">Išanalizuokite konkursų detales ir reikalavimus su AI asistento pagalba.</p>
              </div>
              
              <div className="text-center">
                <div className="bg-[#E6EFF6] w-16 h-16 rounded-full flex items-center justify-center text-[#1A3A5E] mx-auto mb-4 text-2xl font-bold shadow-md">4</div>
                <h3 className="text-lg font-bold mb-2 text-[#1A3A5E]">Dalyvavimas</h3>
                <p className="text-gray-600">Gaukite priminimus apie svarbias datas ir ruoškite pasiūlymus laiku.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Project categories section - Keeping existing but adding more details */}
        <section className="py-20 bg-gradient-to-b from-[#F5F7FA] to-white">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-[#1A3A5E]">Konkursų kategorijos</h2>
              <p className="text-lg text-gray-600 mt-4 max-w-2xl mx-auto">Mūsų sistema apima įvairiausias projektų kategorijas, atitinkančias jūsų kompetencijas</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition border border-gray-100">
                <div className="bg-[#2D6A4F] w-12 h-12 rounded-full flex items-center justify-center text-white mb-4 shadow-md">
                  <FaBuilding className="text-xl" />
                </div>
                <h3 className="text-xl font-bold mb-2 text-[#1A3A5E]">Statybos projektai</h3>
                <ul className="mt-2 space-y-2 mb-4">
                  <li className="flex items-start text-gray-600">
                    <FaCheck className="text-[#2D6A4F] mr-2 mt-1 flex-shrink-0" />
                    <span>Naujų pastatų statyba</span>
                  </li>
                  <li className="flex items-start text-gray-600">
                    <FaCheck className="text-[#2D6A4F] mr-2 mt-1 flex-shrink-0" />
                    <span>Renovacijos ir modernizacijos konkursai</span>
                  </li>
                  <li className="flex items-start text-gray-600">
                    <FaCheck className="text-[#2D6A4F] mr-2 mt-1 flex-shrink-0" />
                    <span>Inžinerinių tinklų įrengimas</span>
                  </li>
                </ul>
                <Link href="/chat" className="inline-block text-[#2D6A4F] font-medium hover:underline">
                  Rodyti konkursus →
                </Link>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition border border-gray-100">
                <div className="bg-[#2D6A4F] w-12 h-12 rounded-full flex items-center justify-center text-white mb-4 shadow-md">
                  <FaRoad className="text-xl" />
                </div>
                <h3 className="text-xl font-bold mb-2 text-[#1A3A5E]">Lauko darbai</h3>
                <ul className="mt-2 space-y-2 mb-4">
                  <li className="flex items-start text-gray-600">
                    <FaCheck className="text-[#2D6A4F] mr-2 mt-1 flex-shrink-0" />
                    <span>Kelių ir takų tiesimas</span>
                  </li>
                  <li className="flex items-start text-gray-600">
                    <FaCheck className="text-[#2D6A4F] mr-2 mt-1 flex-shrink-0" />
                    <span>Teritorijų tvarkymo darbai</span>
                  </li>
                  <li className="flex items-start text-gray-600">
                    <FaCheck className="text-[#2D6A4F] mr-2 mt-1 flex-shrink-0" />
                    <span>Apželdinimas ir aplinkos formavimas</span>
                  </li>
                </ul>
                <Link href="/chat" className="inline-block text-[#2D6A4F] font-medium hover:underline">
                  Rodyti konkursus →
                </Link>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition border border-gray-100">
                <div className="bg-[#2D6A4F] w-12 h-12 rounded-full flex items-center justify-center text-white mb-4 shadow-md">
                  <FaBriefcase className="text-xl" />
                </div>
                <h3 className="text-xl font-bold mb-2 text-[#1A3A5E]">Kiti projektai</h3>
                <ul className="mt-2 space-y-2 mb-4">
                  <li className="flex items-start text-gray-600">
                    <FaCheck className="text-[#2D6A4F] mr-2 mt-1 flex-shrink-0" />
                    <span>Projektavimo paslaugos</span>
                  </li>
                  <li className="flex items-start text-gray-600">
                    <FaCheck className="text-[#2D6A4F] mr-2 mt-1 flex-shrink-0" />
                    <span>Įrangos tiekimas ir montavimas</span>
                  </li>
                  <li className="flex items-start text-gray-600">
                    <FaCheck className="text-[#2D6A4F] mr-2 mt-1 flex-shrink-0" />
                    <span>Priežiūros ir eksploatavimo paslaugos</span>
                  </li>
                </ul>
                <Link href="/chat" className="inline-block text-[#2D6A4F] font-medium hover:underline">
                  Rodyti konkursus →
                </Link>
              </div>
            </div>
          </div>
        </section>
        
        {/* AI Assistant Feature */}
        <section className="py-20 bg-gradient-to-r from-[#1A3A5E] to-[#2D6A4F] text-white">
          <div className="container mx-auto px-4">
            <div className="flex flex-col md:flex-row items-center">
              <div className="md:w-1/2 mb-10 md:mb-0 pr-0 md:pr-8">
                <h2 className="text-3xl md:text-4xl font-bold mb-6 leading-tight">
                  Išmanus AI asistentas jūsų paslaugoms
                </h2>
                <p className="text-lg mb-6">
                  Mūsų dirbtinio intelekto asistentas padeda analizuoti konkursus, suprasti reikalavimus ir atsakyti į klausimus realiu laiku.
                </p>
                <ul className="space-y-4 mb-8">
                  <li className="flex items-start">
                    <div className="bg-[#F4A261] p-1 rounded-full mr-3 mt-1">
                      <FaLightbulb className="text-[#1A3A5E] text-sm" />
                    </div>
                    <span>Gauna informaciją tiesiogiai iš konkursų dokumentų</span>
                  </li>
                  <li className="flex items-start">
                    <div className="bg-[#F4A261] p-1 rounded-full mr-3 mt-1">
                      <FaFileAlt className="text-[#1A3A5E] text-sm" />
                    </div>
                    <span>Padeda suprasti techninius reikalavimus ir sąlygas</span>
                  </li>
                  <li className="flex items-start">
                    <div className="bg-[#F4A261] p-1 rounded-full mr-3 mt-1">
                      <FaChartBar className="text-[#1A3A5E] text-sm" />
                    </div>
                    <span>Analizuoja konkursų tinkamumą pagal jūsų veiklos profilį</span>
                  </li>
                </ul>
                <Link href="/chat" className="inline-block bg-[#F4A261] text-[#1A3A5E] px-6 py-3 rounded-lg hover:bg-[#FFB703] transition font-medium shadow-md">
                  Išbandyti asistentą
                </Link>
              </div>
              <div className="md:w-1/2">
                <div className="bg-gradient-to-br from-[#F5F7FA] to-white p-6 rounded-lg shadow-lg border border-[#F4A261]">
                  <div className="bg-white rounded-lg p-4 shadow-md mb-4">
                    <p className="text-gray-700 mb-2">Kokie konkursai šiuo metu aktyvūs Vilniaus rajone?</p>
                    <div className="text-xs text-gray-500">Jūs, 13:42</div>
                  </div>
                  <div className="bg-[#F0F9F2] rounded-lg p-4 shadow-md mb-4 border border-[#D1EDDA]">
                    <p className="text-gray-700">
                      Šiuo metu Vilniaus rajone yra 5 aktyvūs statybos konkursai:
                      <br/><br/>
                      1. Mokyklos renovacijos projektas, terminas: 2025-06-15
                      <br/>
                      2. Dviračių takų tiesimo darbai, terminas: 2025-07-01
                      <br/>
                      3. Viešosios erdvės sutvarkymas, terminas: 2025-06-30
                      <br/>
                      <br/>
                      Galiu pateikti daugiau informacijos apie kiekvieną konkursą.
                    </p>
                    <div className="text-xs text-gray-500">Projektų Žvalgas asistentas, 13:43</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Trust Signals Section */}
        <section className="py-20 bg-white">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-[#1A3A5E] mb-2">Kodėl verta pasitikėti</h2>
              <p className="text-lg text-gray-600 mt-4 max-w-2xl mx-auto">
                Projektų Žvalgas – tai profesionali platforma, sukurta bendradarbiaujant su statybos ir infrastruktūros ekspertais
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
              <div className="text-center bg-[#F5F7FA] p-8 rounded-lg">
                <div className="inline-flex items-center justify-center p-2 bg-[#E6EFF6] rounded-full mb-4">
                  <FaShieldAlt className="text-[#1A3A5E] text-3xl" />
                </div>
                <h3 className="text-xl font-bold mb-2 text-[#1A3A5E]">Duomenų patikimumas</h3>
                <p className="text-gray-600">Visa informacija surenkama ir atnaujinama iš oficialių šaltinių, užtikrinant jos tikslumą.</p>
              </div>
              
              <div className="text-center bg-[#F5F7FA] p-8 rounded-lg">
                <div className="inline-flex items-center justify-center p-2 bg-[#E6EFF6] rounded-full mb-4">
                  <FaBell className="text-[#1A3A5E] text-3xl" />
                </div>
                <h3 className="text-xl font-bold mb-2 text-[#1A3A5E]">Nuolatiniai atnaujinimai</h3>
                <p className="text-gray-600">Sistema atnaujinama kasdien, užtikrinant naujausių konkursų prieinamumą ir aktualumą.</p>
              </div>
              
              <div className="text-center bg-[#F5F7FA] p-8 rounded-lg">
                <div className="inline-flex items-center justify-center p-2 bg-[#E6EFF6] rounded-full mb-4">
                  <FaUsers className="text-[#1A3A5E] text-3xl" />
                </div>
                <h3 className="text-xl font-bold mb-2 text-[#1A3A5E]">Ekspertų komanda</h3>
                <p className="text-gray-600">Mūsų AI sprendimus vysto ir prižiūri patyrę statybos ir viešųjų pirkimų specialistai.</p>
              </div>
            </div>
          </div>
        </section>
        
        {/* CTA Section */}
        <section className="py-16 bg-gradient-to-r from-[#1A3A5E] to-[#2D6A4F] text-white">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold mb-6">Pasiruošę rasti naujus projektus?</h2>
            <p className="text-xl mb-8 max-w-2xl mx-auto">
              Prisijunkite prie Projektų Žvalgo jau šiandien ir atraskite konkurencingus konkursus savo verslui.
            </p>
            <Link href="/chat" className="inline-block bg-[#F4A261] text-[#1A3A5E] px-8 py-3 rounded-full hover:bg-[#FFB703] transition font-medium shadow-lg">
              Pradėti nemokamai
            </Link>
          </div>
        </section>
      </main>
      
      <footer className="bg-[#1A3A5E] text-white py-4">
        <div className="container mx-auto px-4 md:px-6 text-center text-sm">
          <p>© {new Date().getFullYear()} Projektų ŽVALGAS. Visos teisės saugomos.</p>
          <p className="text-xs mt-1 text-gray-300">Konkursų paieškos platforma</p>
        </div>
      </footer>
    </div>
  );
}