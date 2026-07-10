import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from 'recharts';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface DayData { date: string; count: number; }

interface Props {
  postsPerDay: DayData[];
  usersPerDay: DayData[];
}

function formatDate(dateStr: string) {
  try {
    return format(new Date(dateStr), 'dd/MM', { locale: ptBR });
  } catch {
    return dateStr;
  }
}

export default function Charts({ postsPerDay, usersPerDay }: Props) {
  const postsData = postsPerDay.map(d => ({ ...d, date: formatDate(d.date) }));
  const usersData = usersPerDay.map(d => ({ ...d, date: formatDate(d.date) }));

  // Merge for combined chart
  const allDates = [...new Set([...postsData.map(d => d.date), ...usersData.map(d => d.date)])].sort();
  const combined = allDates.map(date => ({
    date,
    posts: postsData.find(d => d.date === date)?.count || 0,
    users: usersData.find(d => d.date === date)?.count || 0,
  }));

  const tooltipStyle = {
    backgroundColor: '#1f2937',
    border: '1px solid #374151',
    borderRadius: '8px',
    color: '#f9fafb',
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Posts chart */}
      <div className="card p-5">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Postagens nos últimos 7 dias</h3>
        {postsData.length === 0 ? (
          <div className="h-48 flex items-center justify-center text-gray-400 dark:text-gray-500 text-sm">
            Sem dados disponíveis
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={postsData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#9ca3af' }} />
              <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} allowDecimals={false} />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="count" name="Postagens" fill="#6366f1" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Users chart */}
      <div className="card p-5">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Novos usuários nos últimos 7 dias</h3>
        {usersData.length === 0 ? (
          <div className="h-48 flex items-center justify-center text-gray-400 dark:text-gray-500 text-sm">
            Sem dados disponíveis
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={usersData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#9ca3af' }} />
              <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} allowDecimals={false} />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="count" name="Usuários" fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Combined chart */}
      {combined.length > 0 && (
        <div className="card p-5 lg:col-span-2">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Atividade geral (últimos 7 dias)</h3>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={combined}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#9ca3af' }} />
              <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} allowDecimals={false} />
              <Tooltip contentStyle={tooltipStyle} />
              <Legend />
              <Line type="monotone" dataKey="posts" name="Postagens" stroke="#6366f1" strokeWidth={2} dot={{ fill: '#6366f1', r: 4 }} />
              <Line type="monotone" dataKey="users" name="Usuários" stroke="#10b981" strokeWidth={2} dot={{ fill: '#10b981', r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
