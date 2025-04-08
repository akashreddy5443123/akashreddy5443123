import React from 'react';
import { Facebook, Instagram, Linkedin, Youtube } from 'lucide-react'; // Assuming these icons exist

export const Footer = () => {
  return (
    <footer className="bg-gray-800 text-gray-300 mt-auto"> {/* Added mt-auto */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          {/* About Section */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">Presidency University</h3>
            <p className="text-sm">
              Fostering excellence in education, research, and innovation.
            </p>
            <a
              href="https://presidencyuniversity.in/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-indigo-400 hover:text-indigo-300 mt-2 inline-block"
            >
              Visit University Website &rarr;
            </a>
          </div>

          {/* Contact & Social Section */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">Connect With Us</h3>
            <p className="text-sm mb-3">
              Email: <a href="mailto:info@presidencyuniversity.in" className="hover:text-indigo-300">info@presidencyuniversity.in</a> {/* Placeholder Email */}
            </p>
            <div className="flex space-x-4">
              <a href="https://www.facebook.com/PresidencyUniversityBangalore/" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white">
                <Facebook size={20} />
              </a>
              <a href="https://x.com/PresidencyUni" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white">
                <Instagram size={20} /> {/* Using Instagram icon for X/Twitter based on common practice */}
              </a>
              <a href="https://www.youtube.com/channel/UC8pJ9ny-syPA4O9S0QIR9qg" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white">
                <Youtube size={20} />
              </a>
              <a href="https://www.linkedin.com/school/presidency-university/" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white"> {/* Added LinkedIn based on Uni site */}
                <Linkedin size={20} />
              </a>
            </div>
          </div>

          {/* Credits Section */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">Development</h3>
            <p className="text-sm">
              Website Designed & Developed by Presidency University.
            </p>
            {/* Add specific student/team names here if desired */}
            {/* <p className="text-sm mt-2">Team: [Team Name]</p> */}
            {/* <p className="text-sm">Members: [Name 1], [Name 2]</p> */}
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-700 pt-8 text-center">
          <p className="text-sm">
            &copy; {new Date().getFullYear()} Presidency University - All Rights Reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};
