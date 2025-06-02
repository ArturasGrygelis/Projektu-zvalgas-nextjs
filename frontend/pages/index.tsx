import Link from 'next/link';
import Head from 'next/head';
import Image from 'next/image'; // Keep if you plan to use local images
import { 
  FaSearch, FaFilter, FaChartLine, FaCheck, FaStar, FaBriefcase, 
  FaBuilding, FaRoad, FaUsers, FaBell, FaLightbulb, FaFileAlt, 
  FaChartBar, FaShieldAlt, FaCalendarAlt, FaMapMarkerAlt, FaProjectDiagram,
  FaChartPie, FaRegBuilding, FaArrowRight
} from 'react-icons/fa';
import RecentProjects from '../components/RecentProjects'; // Assuming this component is well-optimized

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#F5F7FA] via-white to-[#F5F7FA] text-[#333]">
      <Head>
        <title>PROJEKTŲ ŽVALGAS | Atraskite Paskelbtus Konkursus Akimirksniu</title>
        <meta name="description" content="Projektų Žvalgas: Jūsų išmanusis įrankis statybos, lauko darbų ir kitų projektų konkursų paieškai. Gaukite pranašumą su AI pagalba!" />
        <link rel="icon" href="/favicon.ico" />
        {/* Add Open Graph tags for better social sharing */}
        <meta property="og:title" content="PROJEKTŲ ŽVALGAS | Atraskite Konkursus Akimirksniu" />
        <meta property="og:description" content="Jūsų išmanusis įrankis statybos ir kitų projektų konkursų paieškai. Gaukite pranašumą su AI pagalba!" />
        {/* <meta property="og:image" content="/path/to/your/og-image.jpg" /> */}
        {/* <meta property="og:url" content="https://www.yourwebsite.com" /> */}
        <meta name="twitter:card" content="summary_large_image" />
      </Head>

      <header className="bg-[#1A3A5E] shadow-lg py-4 sticky top-0 z-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <Link href="/" legacyBehavior>
            <a className="flex items-center group">
              <div className="w-10 h-10 mr-3 bg-white rounded-lg flex items-center justify-center text-[#1A3A5E] shadow-sm group-hover:bg-[#FFB703] transition-colors duration-300">
                <FaRegBuilding size={26} className="text-[#1A3A5E] group-hover:text-white transition-colors duration-300" />
              </div>
              <h1 className="text-2xl font-bold">
                <span className="text-[#FFB703]">PROJEKTŲ</span>
                <span className="text-white"> ŽVALGAS</span>
              </h1>
            </a>
          </Link>
          
          <nav>
            <ul className="flex space-x-4 sm:space-x-6 items-center">
              {/* Add other nav links here if needed, e.g., "Apie Mus", "Kainos" */}
              <li>
                <Link href="/chat" legacyBehavior>
                  <a className="bg-[#F4A261] text-[#1A3A5E] px-5 py-2.5 rounded-full hover:bg-[#FFB703] transition-all duration-300 shadow-md hover:shadow-lg font-semibold text-sm transform hover:scale-105">
                    Išbandyti Asistentą
                  </a>
                </Link>
              </li>
            </ul>
          </nav>
        </div>
      </header>
      
      <div className="flex flex-col md:flex-row">
        <RecentProjects /> {/* Ensure this component is engaging and loads fast */}
        
        <main className="flex-1">
          {/* Hero Section */}
          <section className="py-20 md:py-28 bg-gradient-to-br from-[#E0E7FF] via-white to-[#F0F9FF] text-[#1A3A5E] px-4 sm:px-6 lg:px-8 text-center md:text-left">
            <div className="container mx-auto">
              <div className="max-w-3xl mx-auto md:mx-0">
                <h2 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold mb-6 leading-tight">
                  Atraskite <span className="text-[#2D6A4F]">Prieinamus</span> Konkursus Akimirksniu!
                </h2>
                <p className="text-lg sm:text-xl mb-10 text-gray-700 max-w-2xl mx-auto md:mx-0">
                  Nustokite švaistyti laiką rankinei paieškai. Projektų Žvalgas sujungia jus su aktualiausiais statybos, lauko darbų ir kitų sričių konkursais, naudojant pažangią AI technologiją.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
                  <Link href="/chat" legacyBehavior>
                    <a className="bg-[#F4A261] text-[#1A3A5E] px-8 py-4 rounded-full hover:bg-[#FFB703] transition-all duration-300 font-semibold text-lg shadow-xl hover:shadow-2xl transform hover:scale-105 flex items-center justify-center group">
                      Pradėti Paiešką Dabar <FaArrowRight className="ml-2 transition-transform duration-300 group-hover:translate-x-1" />
                    </a>
                  </Link>
                  <Link href="#features" legacyBehavior>
                    <a className="bg-transparent text-[#2D6A4F] px-8 py-4 rounded-full hover:bg-[#D1EDDA] transition-all duration-300 font-semibold text-lg border-2 border-[#2D6A4F] hover:border-[#2D6A4F] flex items-center justify-center group">
                      Sužinoti Daugiau
                    </a>
                  </Link>
                </div>
              </div>
            </div>
          </section>

          {/* Features section - "Kodėl Rinktis Mus?" */}
          <section id="features" className="py-16 sm:py-20 bg-white px-4 sm:px-6 lg:px-8">
            <div className="container mx-auto">
              <div className="text-center mb-14">
                <h2 className="text-3xl sm:text-4xl font-bold text-[#1A3A5E] mb-3">Kodėl Verta Rinktis Projektų Žvalgą?</h2>
                <p className="text-lg text-gray-600 mt-4 max-w-2xl mx-auto">Gaukite konkurencinį pranašumą su įrankiais, sukurtais jūsų sėkmei.</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12">
                {[
                  { icon: FaSearch, title: "Tikslinė Paieška", description: "Sutaupykite valandas su mūsų AI valdoma paieška, kuri randa būtent jums tinkančius konkursus." },
                  { icon: FaFilter, title: "Išmanieji Filtrai", description: "Greitai susiaurinkite paiešką pagal regioną, vertę, tipą ir kitus svarbius kriterijus." },
                  { icon: FaProjectDiagram, title: "Daugiau Verslo Galimybių", description: "Platesnis konkursų pasirinkimas reiškia daugiau potencialių projektų ir augimo jūsų verslui." }
                ].map((feature, index) => (
                  <div key={index} className="bg-gradient-to-br from-[#F9FAFB] to-white p-8 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 border border-gray-200 transform hover:-translate-y-1">
                    <div className="bg-gradient-to-r from-[#2D6A4F] to-[#1B4332] w-14 h-14 rounded-xl flex items-center justify-center text-white mb-6 shadow-md">
                      <feature.icon className="text-2xl" />
                    </div>
                    <h3 className="text-xl font-semibold mb-4 text-[#1A3A5E]">{feature.title}</h3>
                    <p className="text-gray-600 leading-relaxed">{feature.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* How It Works Section */}
          <section className="py-16 sm:py-20 bg-gradient-to-b from-[#F0F9FF] to-white px-4 sm:px-6 lg:px-8">
            <div className="container mx-auto">
              <div className="text-center mb-14">
                <h2 className="text-3xl sm:text-4xl font-bold text-[#1A3A5E] mb-3">Pradėkite Lengvai per 4 Žingsnius</h2>
                <p className="text-lg text-gray-600 mt-4 max-w-2xl mx-auto">Mūsų intuityvi platforma sukurta taip, kad galėtumėte greitai ir efektyviai rasti bei vertinti konkursus.</p>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">
                {[
                  { step: "1", title: "Registracija", description: "Greitai ir paprastai gaukite prieigą prie išsamios konkursų duomenų bazės." },
                  { step: "2", title: "Paieška ir Filtravimas", description: "Naudokite galingus filtrus, kad rastumėte projektus pagal jūsų specializaciją." },
                  { step: "3", title: "AI Analizė", description: "Leiskite mūsų AI asistentui padėti suprasti reikalavimus ir dokumentaciją." },
                  { step: "4", title: "Dalyvavimas Projekte", description: "Gaukite priminimus ir sekite svarbiausias datas, kad nepraleistumėte galimybių." }
                ].map((item) => (
                  <div key={item.step} className="text-center p-6 bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300 border border-gray-100">
                    <div className="bg-gradient-to-r from-[#FFB703] to-[#F4A261] w-16 h-16 rounded-full flex items-center justify-center text-white mx-auto mb-5 text-2xl font-bold shadow-lg">{item.step}</div>
                    <h3 className="text-xl font-semibold mb-2 text-[#1A3A5E]">{item.title}</h3>
                    <p className="text-sm text-gray-600 leading-relaxed">{item.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Project categories section */}
          <section className="py-16 sm:py-20 bg-white px-4 sm:px-6 lg:px-8">
            <div className="container mx-auto">
              <div className="text-center mb-14">
                <h2 className="text-3xl sm:text-4xl font-bold text-[#1A3A5E]">Platus Konkursų Spektras</h2>
                <p className="text-lg text-gray-600 mt-4 max-w-2xl mx-auto">Nuo statybos iki specializuotų paslaugų – raskite projektus, atitinkančius jūsų kompetencijas.</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {[
                  { icon: FaBuilding, title: "Statybos Projektai", items: ["Naujų pastatų statyba", "Renovacijos ir modernizacijos", "Inžineriniai tinklai"] },
                  { icon: FaRoad, title: "Lauko ir Infrastruktūros Darbai", items: ["Kelių ir takų tiesimas", "Teritorijų tvarkymas", "Aplinkosaugos projektai"] },
                  { icon: FaBriefcase, title: "Specializuotos Paslaugos", items: ["Projektavimo paslaugos", "Įrangos tiekimas ir montavimas", "Konsultacijos ir ekspertizės"] }
                ].map((category, index) => (
                  <div key={index} className="bg-gradient-to-br from-[#F9FAFB] to-white p-8 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 border border-gray-200 flex flex-col">
                    <div className="bg-gradient-to-r from-[#2D6A4F] to-[#1B4332] w-14 h-14 rounded-xl flex items-center justify-center text-white mb-6 shadow-md">
                      <category.icon className="text-2xl" />
                    </div>
                    <h3 className="text-xl font-semibold mb-3 text-[#1A3A5E]">{category.title}</h3>
                    <ul className="space-y-2 mb-6 text-gray-600 text-sm flex-grow">
                      {category.items.map((item, i) => (
                        <li key={i} className="flex items-start">
                          <FaCheck className="text-[#2D6A4F] mr-2.5 mt-1 flex-shrink-0 text-base" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                    <Link href="/chat" legacyBehavior>
                      <a className="mt-auto inline-block text-center bg-[#2D6A4F] text-white px-6 py-2.5 rounded-lg hover:bg-[#1B4332] transition-colors duration-300 font-medium text-sm group">
                        Peržiūrėti Konkursus <FaArrowRight className="inline-block ml-1 transition-transform duration-300 group-hover:translate-x-1" />
                      </a>
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          </section>
          
          {/* AI Assistant Feature */}
          <section className="py-16 sm:py-20 bg-gradient-to-r from-[#1A3A5E] to-[#224B70] text-white px-4 sm:px-6 lg:px-8">
            <div className="container mx-auto">
              <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-16">
                <div className="lg:w-1/2 text-center lg:text-left">
                  <h2 className="text-3xl sm:text-4xl font-bold mb-6 leading-tight">
                    Jūsų Asmeninis <span className="text-[#FFB703]">AI Pagalbininkas</span> Konkursuose
                  </h2>
                  <p className="text-lg mb-8 text-gray-200">
                    Mūsų išmanusis asistentas analizuoja sudėtingus dokumentus, atsako į jūsų klausimus ir padeda priimti pagrįstus sprendimus – viskas realiu laiku.
                  </p>
                  <ul className="space-y-4 mb-10 text-left max-w-md mx-auto lg:mx-0">
                    {[
                      { icon: FaLightbulb, text: "Automatiškai išgauna esminę informaciją iš konkursų dokumentų." },
                      { icon: FaFileAlt, text: "Padeda greitai suprasti techninius reikalavimus ir sąlygas." },
                      { icon: FaChartBar, text: "Teikia įžvalgas, padedančias įvertinti projekto tinkamumą." }
                    ].map((item, index) => (
                      <li key={index} className="flex items-start">
                        <div className="bg-gradient-to-r from-[#FFB703] to-[#F4A261] p-2 rounded-full mr-4 mt-0.5 shadow">
                          <item.icon className="text-[#1A3A5E] text-lg" />
                        </div>
                        <span className="text-gray-100">{item.text}</span>
                      </li>
                    ))}
                  </ul>
                  <Link href="/chat" legacyBehavior>
                    <a className="inline-block bg-[#F4A261] text-[#1A3A5E] px-8 py-4 rounded-full hover:bg-[#FFB703] transition-all duration-300 font-semibold text-lg shadow-xl hover:shadow-2xl transform hover:scale-105 group">
                      Išbandykite AI Asistentą <FaArrowRight className="ml-2 transition-transform duration-300 group-hover:translate-x-1" />
                    </a>
                  </Link>
                </div>
                <div className="lg:w-1/2 mt-10 lg:mt-0">
                  <div className="bg-white/10 backdrop-blur-md p-6 sm:p-8 rounded-xl shadow-2xl border border-white/20">
                    <div className="bg-white rounded-lg p-4 shadow-lg mb-4">
                      <p className="text-gray-800 mb-1 text-sm font-medium">Jūs:</p>
                      <p className="text-gray-700 text-sm">Kokie yra pagrindiniai reikalavimai "Mokyklos renovacijos" projektui Kaune?</p>
                      <div className="text-xs text-gray-500 mt-2 text-right">13:42</div>
                    </div>
                    <div className="bg-gradient-to-br from-[#E6F3EC] to-[#D1EDDA] rounded-lg p-4 shadow-lg border border-green-200">
                      <p className="text-[#1A3A5E] mb-1 text-sm font-medium">Projektų Žvalgas Asistentas:</p>
                      <p className="text-gray-700 text-sm">
                        Analizuoju dokumentą... Pagrindiniai reikalavimai "Mokyklos renovacijos" projektui Kaune apima:
                        <br/>- Energetinio efektyvumo klasė ne žemesnė nei A+.
                        <br/>- Darbų atlikimo terminas: 12 mėnesių.
                        <br/>- Būtina patirtis bent 3 panašios apimties objektuose.
                        <br/>Ar norėtumėte sužinoti daugiau apie kvalifikacinius kriterijus?
                      </p>
                      <div className="text-xs text-gray-500 mt-2 text-right">13:43</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Final CTA Section */}
          <section className="py-16 sm:py-20 bg-gradient-to-r from-[#F0F9FF] to-white px-4 sm:px-6 lg:px-8">
            <div className="container mx-auto text-center">
              <h2 className="text-3xl sm:text-4xl font-bold text-[#1A3A5E] mb-6">Pasiruošę Atrasti Naujas Galimybes?</h2>
              <p className="text-lg text-gray-700 mb-10 max-w-xl mx-auto">
                Prisijunkite prie Projektų Žvalgo šiandien ir paverskite konkursų paieškos iššūkį į strateginį pranašumą.
              </p>
              <div className="inline-block"> {/* Wrapper to ensure button stays as one unit */}
                <Link href="/chat" legacyBehavior>
                  <a className="bg-[#2D6A4F] text-white px-10 py-4 rounded-full hover:bg-[#1B4332] transition-all duration-300 font-semibold text-lg shadow-xl hover:shadow-2xl transform hover:scale-105 whitespace-nowrap flex items-center justify-center">
                    Pradėti Nemokamą Bandomąjį Laikotarpį <FaArrowRight className="ml-2 transition-transform duration-300 group-hover:translate-x-1" />
                  </a>
                </Link>
              </div>
            </div>
          </section>
        </main>
      </div>
      
      <div className="py-3 bg-gradient-to-r from-[#1A3A5E] via-[#2D6A4F] to-[#1A3A5E]"></div>
      
      <footer className="bg-[#1A3A5E] text-white pt-16 pb-8">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 mb-10">
            {/* Column 1: About */}
            <div>
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 mr-3 bg-white rounded-lg flex items-center justify-center text-[#1A3A5E] shadow-sm">
                  <FaRegBuilding size={26} className="text-[#1A3A5E]" />
                </div>
                <h3 className="font-bold text-xl">
                  <span className="text-[#FFB703]">PROJEKTŲ</span>
                  <span className="text-white"> ŽVALGAS</span>
                </h3>
              </div>
              <p className="text-sm text-gray-300 leading-relaxed mb-4">
                Moderniausia konkursų paieškos platforma Lietuvoje. Atraskite aktualius konkursus ir projektus vienoje vietoje, pasitelkdami AI galią.
              </p>
            </div>

            {/* Column 2: Services */}
            <div>
              <h4 className="font-semibold text-lg mb-4 text-[#FFB703]">Pagrindinės Funkcijos</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/chat" className="text-gray-300 hover:text-white transition">Išmani Konkursų Paieška</Link></li>
                <li><Link href="/chat" className="text-gray-300 hover:text-white transition">AI Varomas Asistentas</Link></li>
                <li><Link href="#features" className="text-gray-300 hover:text-white transition">Detalus Filtravimas</Link></li>
                <li><a href="#" className="text-gray-300 hover:text-white transition">Priminimai ir Sekimas</a></li> {/* Placeholder */}
              </ul>
            </div>

            {/* Column 3: Quick Links */}
            <div>
              <h4 className="font-semibold text-lg mb-4 text-[#FFB703]">Naudingos Nuorodos</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="text-gray-300 hover:text-white transition">Apie Mus</a></li> {/* Placeholder */}
                <li><a href="#" className="text-gray-300 hover:text-white transition">Dažniausiai Užduodami Klausimai</a></li> {/* Placeholder */}
                <li><a href="#" className="text-gray-300 hover:text-white transition">Pagalba ir Palaikymas</a></li> {/* Placeholder */}
                <li><Link href="#contact" className="text-gray-300 hover:text-white transition">Kontaktai</Link></li>
              </ul>
            </div>

            {/* Column 4: Contact */}
            <div id="contact">
              <h4 className="font-semibold text-lg mb-4 text-[#FFB703]">Susisiekite</h4>
              <ul className="space-y-3 text-sm">
                <li className="text-gray-300 flex items-center">
                  <FaMapMarkerAlt className="mr-2 text-[#FFB703]" /> Vilnius, Lietuva
                </li>
                <li className="text-gray-300">
                  <a href="mailto:info@projektu-zvalgas.lt" className="hover:text-white transition flex items-center">
                    <FaFileAlt className="mr-2 text-[#FFB703]" /> info@projektu-zvalgas.lt
                  </a>
                </li>
                <li className="text-gray-300">
                  <a href="tel:+37060000000" className="hover:text-white transition flex items-center">
                    <FaUsers className="mr-2 text-[#FFB703]" /> +370 600 00000
                  </a>
                </li>
              </ul>
              {/* Social Media Icons (Optional) */}
              {/* <div className="mt-4 flex space-x-3">
                <a href="#" className="text-gray-300 hover:text-white"><FaFacebookF size={18}/></a>
                <a href="#" className="text-gray-300 hover:text-white"><FaLinkedinIn size={18}/></a>
              </div> */}
            </div>
          </div>
          
          <div className="border-t border-gray-700 pt-6 text-center">
            <p className="text-sm text-gray-400">&copy; {new Date().getFullYear()} Projektų ŽVALGAS. Visos teisės saugomos.</p>
            <div className="mt-3 space-x-4">
              <a href="#" className="text-xs text-gray-400 hover:text-white transition">Privatumo politika</a>
              <a href="#" className="text-xs text-gray-400 hover:text-white transition">Naudojimosi sąlygos</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}