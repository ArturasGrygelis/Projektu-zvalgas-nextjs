import Link from 'next/link';
import Head from 'next/head';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import { 
  FaSearch, FaFilter, FaChartLine, FaCheck, FaStar, FaBriefcase, 
  FaBuilding, FaRoad, FaUsers, FaBell, FaLightbulb, FaFileAlt, 
  FaChartBar, FaShieldAlt, FaCalendarAlt, FaMapMarkerAlt, FaProjectDiagram
} from 'react-icons/fa';
import RecentProjects from '../components/RecentProjects';

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
      
      {/* Main Content with Sidebar Layout */}
      <div className="flex flex-col md:flex-row">
        {/* Sidebar with Recent Projects */}
        <RecentProjects />
        
        {/* Main Content */}
        <main className="flex-1">
          {/* Hero Section */}
          <section className="py-16 bg-gradient-to-r from-[#F5F7FA] to-white text-[#1A3A5E] px-4">
            <div className="max-w-4xl mx-auto">
              <h1 className="text-3xl md:text-5xl font-bold mb-6 leading-tight text-[#1A3A5E]">
                Raskite tinkamiausius konkursus savo verslui!
              </h1>
              <p className="text-lg mb-8 text-gray-700">
                Projektų Žvalgas — tai internetinė platforma, padedanti įmonėms ir specialistams atrasti aktyvius ir aktualius konkursus statybos, lauko darbų ir kitų projektų vykdymui.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/chat" className="bg-[#F4A261] text-[#1A3A5E] px-8 py-3 rounded-full hover:bg-[#FFB703] transition font-medium text-center shadow-lg">
                  Rasti konkursus
                </Link>
              </div>
            </div>
          </section>

          {/* Features section */}
          <section id="features" className="py-16 bg-gradient-to-b from-white to-[#F5F7FA] px-4">
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-12">
                <h2 className="text-3xl font-bold text-[#1A3A5E] mb-2">Mūsų privalumai</h2>
                <p className="text-lg text-gray-600 mt-4">Sistema analizuoja, filtruoja ir pateikia labiausiai tinkamus bei šiuo metu galiojančius konkursus pagal jūsų poreikius</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition border border-gray-100">
                  <div className="bg-[#2D6A4F] w-12 h-12 rounded-full flex items-center justify-center text-white mb-6 shadow-md">
                    <FaSearch className="text-xl" />
                  </div>
                  <h3 className="text-lg font-bold mb-4 text-[#1A3A5E]">Išmani paieška</h3>
                  <p className="text-gray-600">Pažangi paieškos sistema, padedanti rasti tinkamiausius konkursus.</p>
                </div>
                
                <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition border border-gray-100">
                  <div className="bg-[#2D6A4F] w-12 h-12 rounded-full flex items-center justify-center text-white mb-6 shadow-md">
                    <FaFilter className="text-xl" />
                  </div>
                  <h3 className="text-lg font-bold mb-4 text-[#1A3A5E]">Konkursų filtravimas</h3>
                  <p className="text-gray-600">Pažangūs filtrai, leidžiantys greitai atrasti aktualius konkursus.</p>
                </div>
                
                <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition border border-gray-100">
                  <div className="bg-[#2D6A4F] w-12 h-12 rounded-full flex items-center justify-center text-white mb-6 shadow-md">
                    <FaProjectDiagram className="text-xl" />
                  </div>
                  <h3 className="text-lg font-bold mb-4 text-[#1A3A5E]">Verslo galimybės</h3>
                  <p className="text-gray-600">Didesnis konkursų pasirinkimas reiškia daugiau galimybių jūsų verslui.</p>
                </div>
              </div>
            </div>
          </section>

          {/* How It Works Section */}
          <section className="py-16 bg-white px-4">
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-12">
                <h2 className="text-3xl font-bold text-[#1A3A5E] mb-2">Kaip tai veikia</h2>
                <p className="text-lg text-gray-600 mt-4">Paprastas procesas, padedantis efektyviai surasti ir dalyvauti konkursuose</p>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
                <div className="text-center">
                  <div className="bg-[#E6EFF6] w-14 h-14 rounded-full flex items-center justify-center text-[#1A3A5E] mx-auto mb-4 text-xl font-bold shadow-md">1</div>
                  <h3 className="text-lg font-bold mb-2 text-[#1A3A5E]">Prisijungimas</h3>
                  <p className="text-sm text-gray-600">Prieiga prie konkursų duombazės su išsamia informacija.</p>
                </div>
                
                <div className="text-center">
                  <div className="bg-[#E6EFF6] w-14 h-14 rounded-full flex items-center justify-center text-[#1A3A5E] mx-auto mb-4 text-xl font-bold shadow-md">2</div>
                  <h3 className="text-lg font-bold mb-2 text-[#1A3A5E]">Paieška</h3>
                  <p className="text-sm text-gray-600">Naudokite pažangius filtrus pagal regioną, vertę, tipą.</p>
                </div>
                
                <div className="text-center">
                  <div className="bg-[#E6EFF6] w-14 h-14 rounded-full flex items-center justify-center text-[#1A3A5E] mx-auto mb-4 text-xl font-bold shadow-md">3</div>
                  <h3 className="text-lg font-bold mb-2 text-[#1A3A5E]">Analizė</h3>
                  <p className="text-sm text-gray-600">Išanalizuokite reikalavimus su AI asistento pagalba.</p>
                </div>
                
                <div className="text-center">
                  <div className="bg-[#E6EFF6] w-14 h-14 rounded-full flex items-center justify-center text-[#1A3A5E] mx-auto mb-4 text-xl font-bold shadow-md">4</div>
                  <h3 className="text-lg font-bold mb-2 text-[#1A3A5E]">Dalyvavimas</h3>
                  <p className="text-sm text-gray-600">Gaukite priminimus apie svarbias datas.</p>
                </div>
              </div>
            </div>
          </section>

          {/* Project categories section */}
          <section className="py-16 bg-gradient-to-b from-[#F5F7FA] to-white px-4">
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-12">
                <h2 className="text-3xl font-bold text-[#1A3A5E]">Konkursų kategorijos</h2>
                <p className="text-lg text-gray-600 mt-4">Mūsų sistema apima įvairiausias projektų kategorijas</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-5 rounded-lg shadow-md hover:shadow-lg transition border border-gray-100">
                  <div className="bg-[#2D6A4F] w-10 h-10 rounded-full flex items-center justify-center text-white mb-4 shadow-md">
                    <FaBuilding className="text-lg" />
                  </div>
                  <h3 className="text-lg font-bold mb-2 text-[#1A3A5E]">Statybos projektai</h3>
                  <ul className="mt-2 space-y-2 mb-4">
                    <li className="flex items-start text-gray-600 text-sm">
                      <FaCheck className="text-[#2D6A4F] mr-2 mt-1 flex-shrink-0" />
                      <span>Naujų pastatų statyba</span>
                    </li>
                    <li className="flex items-start text-gray-600 text-sm">
                      <FaCheck className="text-[#2D6A4F] mr-2 mt-1 flex-shrink-0" />
                      <span>Renovacijos ir modernizacijos</span>
                    </li>
                  </ul>
                  <Link href="/chat" className="inline-block text-[#2D6A4F] font-medium hover:underline text-sm">
                    Rodyti konkursus →
                  </Link>
                </div>
                
                <div className="bg-white p-5 rounded-lg shadow-md hover:shadow-lg transition border border-gray-100">
                  <div className="bg-[#2D6A4F] w-10 h-10 rounded-full flex items-center justify-center text-white mb-4 shadow-md">
                    <FaRoad className="text-lg" />
                  </div>
                  <h3 className="text-lg font-bold mb-2 text-[#1A3A5E]">Lauko darbai</h3>
                  <ul className="mt-2 space-y-2 mb-4">
                    <li className="flex items-start text-gray-600 text-sm">
                      <FaCheck className="text-[#2D6A4F] mr-2 mt-1 flex-shrink-0" />
                      <span>Kelių ir takų tiesimas</span>
                    </li>
                    <li className="flex items-start text-gray-600 text-sm">
                      <FaCheck className="text-[#2D6A4F] mr-2 mt-1 flex-shrink-0" />
                      <span>Teritorijų tvarkymo darbai</span>
                    </li>
                  </ul>
                  <Link href="/chat" className="inline-block text-[#2D6A4F] font-medium hover:underline text-sm">
                    Rodyti konkursus →
                  </Link>
                </div>
                
                <div className="bg-white p-5 rounded-lg shadow-md hover:shadow-lg transition border border-gray-100">
                  <div className="bg-[#2D6A4F] w-10 h-10 rounded-full flex items-center justify-center text-white mb-4 shadow-md">
                    <FaBriefcase className="text-lg" />
                  </div>
                  <h3 className="text-lg font-bold mb-2 text-[#1A3A5E]">Kiti projektai</h3>
                  <ul className="mt-2 space-y-2 mb-4">
                    <li className="flex items-start text-gray-600 text-sm">
                      <FaCheck className="text-[#2D6A4F] mr-2 mt-1 flex-shrink-0" />
                      <span>Projektavimo paslaugos</span>
                    </li>
                    <li className="flex items-start text-gray-600 text-sm">
                      <FaCheck className="text-[#2D6A4F] mr-2 mt-1 flex-shrink-0" />
                      <span>Įrangos tiekimas ir montavimas</span>
                    </li>
                  </ul>
                  <Link href="/chat" className="inline-block text-[#2D6A4F] font-medium hover:underline text-sm">
                    Rodyti konkursus →
                  </Link>
                </div>
              </div>
            </div>
          </section>
          
          {/* AI Assistant Feature */}
          <section className="py-16 bg-gradient-to-r from-[#1A3A5E] to-[#2D6A4F] text-white px-4">
            <div className="max-w-4xl mx-auto">
              <div className="flex flex-col md:flex-row items-center">
                <div className="md:w-1/2 mb-10 md:mb-0 pr-0 md:pr-8">
                  <h2 className="text-2xl md:text-3xl font-bold mb-6 leading-tight">
                    Išmanus AI asistentas jūsų paslaugoms
                  </h2>
                  <p className="text-lg mb-6">
                    Mūsų dirbtinio intelekto asistentas padeda analizuoti konkursus ir atsakyti į klausimus realiu laiku.
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
                      <span>Padeda suprasti techninius reikalavimus</span>
                    </li>
                  </ul>
                  <Link href="/chat" className="inline-block bg-[#F4A261] text-[#1A3A5E] px-6 py-3 rounded-lg hover:bg-[#FFB703] transition font-medium shadow-md">
                    Išbandyti asistentą
                  </Link>
                </div>
                <div className="md:w-1/2">
                  <div className="bg-gradient-to-br from-[#F5F7FA] to-white p-4 rounded-lg shadow-lg border border-[#F4A261]">
                    <div className="bg-white rounded-lg p-3 shadow-md mb-3">
                      <p className="text-gray-700 mb-2 text-sm">Kokie konkursai šiuo metu aktyvūs Vilniaus rajone?</p>
                      <div className="text-xs text-gray-500">Jūs, 13:42</div>
                    </div>
                    <div className="bg-[#F0F9F2] rounded-lg p-3 shadow-md mb-3 border border-[#D1EDDA]">
                      <p className="text-gray-700 text-sm">
                        Šiuo metu Vilniaus rajone yra 5 aktyvūs statybos konkursai:
                        <br/><br/>
                        1. Mokyklos renovacijos projektas, terminas: 2025-06-15
                        <br/>
                        2. Dviračių takų tiesimo darbai, terminas: 2025-07-01
                        <br/>
                        3. Viešosios erdvės sutvarkymas, terminas: 2025-06-30
                      </p>
                      <div className="text-xs text-gray-500">Projektų Žvalgas asistentas, 13:43</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* CTA Section */}
          <section className="py-12 bg-gradient-to-r from-[#1A3A5E] to-[#2D6A4F] text-white px-4">
            <div className="max-w-4xl mx-auto text-center">
              <h2 className="text-2xl font-bold mb-4">Pasiruošę rasti naujus projektus?</h2>
              <p className="text-lg mb-6 max-w-2xl mx-auto">
                Prisijunkite prie Projektų Žvalgo jau šiandien ir atraskite konkurencingus konkursus savo verslui.
              </p>
              <div className="flex flex-col sm:flex-row justify-center gap-4">
                <Link href="/chat" className="inline-block bg-[#F4A261] text-[#1A3A5E] px-6 py-2 rounded-full hover:bg-[#FFB703] transition font-medium shadow-lg">
                  Pradėti nemokamai
                </Link>
              </div>
            </div>
          </section>
        </main>
      </div>
      
      <footer className="bg-[#1A3A5E] text-white py-6">
        <div className="container mx-auto px-4 md:px-6">
          <div className="flex flex-col md:flex-row justify-between mb-4">
            <div className="mb-4 md:mb-0">
              <h3 className="font-bold text-lg mb-2">
                <span className="text-[#FFB703]">PROJEKTŲ</span>
                <span className="text-white"> ŽVALGAS</span>
              </h3>
              <p className="text-sm text-gray-300 max-w-xs">
                Moderniausia konkursų paieškos platforma.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold mb-2 text-[#FFB703]">Paslaugos</h4>
                <ul className="space-y-1 text-sm">
                  <li><a href="#" className="text-gray-300 hover:text-white transition">Konkursų paieška</a></li>
                  <li><a href="#" className="text-gray-300 hover:text-white transition">AI asistentas</a></li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-2 text-[#FFB703]">Kontaktai</h4>
                <ul className="space-y-1 text-sm">
                  <li className="text-gray-300">info@projektu-zvalgas.lt</li>
                  <li className="text-gray-300">+370 600 00000</li>
                </ul>
              </div>
            </div>
          </div>
          <div className="border-t border-gray-700 pt-4 flex flex-col sm:flex-row justify-between items-center">
            <p className="text-sm text-gray-400">© {new Date().getFullYear()} Projektų ŽVALGAS. Visos teisės saugomos.</p>
            <div className="mt-2 sm:mt-0">
              <a href="#" className="text-xs text-gray-400 hover:text-white mx-2">Privatumo politika</a>
              <a href="#" className="text-xs text-gray-400 hover:text-white mx-2">Sąlygos</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}