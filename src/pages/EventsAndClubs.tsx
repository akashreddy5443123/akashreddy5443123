import { EventCard } from '../components/EventCard';
export function EventsAndClubs() {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-white mb-8">Events & Clubs</h1>
        <div className="flex justify-between items-center mb-8">
          <div className="flex space-x-4">
            <input
              type="text"
              placeholder="Search events or clubs..."
              className="px-4 py-2 border border-gray-300 rounded-lg"
            />
            <select className="px-4 py-2 border border-gray-300 rounded-lg">
              <option value="all">All Categories</option>
              <option value="academic">Academic</option>
              <option value="social">Social</option>
              <option value="sports">Sports</option>
            </select>
          </div>
        </div>
  
        {/* Events Section */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">Upcoming Events</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Event cards would go here */}
          </div>
        </section>
  
        {/* Clubs Section */}
        <section>
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">Active Clubs</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Club cards would go here */}
          </div>
        </section>
      </div>
    );
  }