import { useState, useEffect } from 'react';
import { getAllTeams } from '../../services/judgeService';
import Loader from '../Loader';
import { getEventLabel, getEventColor } from '../../utils/helpers';

const TeamsView = () => {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const eventTypes = [
    { value: 'all', label: 'All Events' },
    { value: 'poster-presentation', label: 'Poster Presentation' },
    { value: 'paper-presentation', label: 'Paper Presentation' },
    { value: 'startup-expo', label: 'Startup Expo' },
  ];

  useEffect(() => {
    fetchTeams();
  }, []);

  const fetchTeams = async () => {
    try {
      const data = await getAllTeams();
      setTeams(data);
    } catch (error) {
      alert('Failed to fetch teams');
    } finally {
      setLoading(false);
    }
  };

  const filteredTeams =
    selectedEvent === 'all'
      ? teams
      : teams.filter((team) => team.eventType === selectedEvent);

  // Apply search filter
  const searchFilteredTeams = filteredTeams.filter(team => {
    const searchLower = searchTerm.toLowerCase();
    const nameMatch = team.name.toLowerCase().includes(searchLower);
    const memberMatch = team.members && Array.isArray(team.members) && 
      team.members.some(member => member.name && member.name.toLowerCase().includes(searchLower));
    return nameMatch || memberMatch;
  });

  if (loading) return <Loader />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <h2 className="text-2xl font-bold text-gray-900">All Teams</h2>
        <select
          value={selectedEvent}
          onChange={(e) => setSelectedEvent(e.target.value)}
          className="input-field max-w-xs"
        >
          {eventTypes.map((event) => (
            <option key={event.value} value={event.value}>
              {event.label}
            </option>
          ))}
        </select>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <input
          type="text"
          placeholder="Search teams by name or member name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        />
        <svg
          className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
      </div>

      <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {searchFilteredTeams.map((team) => (
          <div key={team._id} className="card">
            <div className="flex justify-between items-start mb-3">
              <h3 className="text-lg font-semibold text-gray-900">{team.name}</h3>
              <span
                className={`inline-block px-3 py-1 text-xs font-medium rounded-full ${getEventColor(
                  team.eventType
                )}`}
              >
                {getEventLabel(team.eventType)}
              </span>
            </div>

            <div className="space-y-3">
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">
                  Team Members ({team.totalMembers}):
                </p>
                <div className="space-y-1 max-h-40 overflow-y-auto">
                  {team.members.map((member, idx) => (
                    <div key={idx} className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
                      <p className="font-medium">{member.name}</p>
                      <p className="text-xs">{member.email}</p>
                      {member.role && (
                        <p className="text-xs text-gray-500">{member.role}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {team.description && (
                <div>
                  <p className="text-sm font-medium text-gray-700">Description:</p>
                  <p className="text-sm text-gray-600 mt-1">{team.description}</p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {searchFilteredTeams.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">
            {teams.length === 0 ? 'No teams found.' : 'No teams match your search criteria.'}
          </p>
        </div>
      )}
    </div>
  );
};

export default TeamsView;
