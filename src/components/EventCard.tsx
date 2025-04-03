interface EventCardProps {
    event: {
      id: string;
      title: string;
      description: string;
      date: string;
      location: string;
      isRegistered?: boolean;
    };
    onRegister: (eventId: string) => Promise<void>;
    onUnregister: (eventId: string) => Promise<void>;
  }
  
  export function EventCard({ event, onRegister, onUnregister }: EventCardProps) {
    const [loading, setLoading] = useState(false);
  
    const handleRegistrationToggle = async () => {
      setLoading(true);
      try {
        if (event.isRegistered) {
          await onUnregister(event.id);
        } else {
          await onRegister(event.id);
        }
      } catch (error) {
        console.error('Registration error:', error);
      } finally {
        setLoading(false);
      }
    };
  
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-xl font-semibold text-gray-900">{event.title}</h3>
        <p className="text-gray-600 mt-2">{event.description}</p>
        <div className="mt-4 flex items-center text-sm text-gray-500">
          <span>{new Date(event.date).toLocaleDateString()}</span>
          <span className="mx-2">•</span>
          <span>{event.location}</span>
        </div>
        <button
          onClick={handleRegistrationToggle}
          disabled={loading}
          className={`mt-4 px-6 py-2 rounded-lg font-medium ${
            event.isRegistered
              ? 'bg-red-100 text-red-700 hover:bg-red-200'
              : 'bg-indigo-600 text-white hover:bg-indigo-700'
          } disabled:opacity-50`}
        >
          {loading 
            ? 'Processing...' 
            : event.isRegistered 
              ? 'Unregister' 
              : 'Register'}
        </button>
      </div>
    );
  }