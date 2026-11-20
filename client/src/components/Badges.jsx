/** Small presentational badges for ticket status, priority, and category. */

const STATUS_COLORS = {
  Open: 'blue',
  'In Progress': 'amber',
  Resolved: 'green',
  Closed: 'gray',
};
const PRIORITY_COLORS = {
  Critical: 'red',
  High: 'amber',
  Medium: 'blue',
  Low: 'gray',
};

export const StatusBadge = ({ value }) => (
  <span className={`badge ${STATUS_COLORS[value] || 'gray'}`}>{value}</span>
);

export const PriorityBadge = ({ value }) => (
  <span className={`badge ${PRIORITY_COLORS[value] || 'gray'}`}>{value}</span>
);

export const CategoryBadge = ({ value }) => (
  <span className="badge gray">{value}</span>
);
