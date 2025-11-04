import { useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import './AuthorAnalysis.css';

type AuthorData = {
  author: string;
  postCount: number;
};

type Props = {
  authorData: AuthorData[];
};

const AuthorAnalysis = ({ authorData }: Props) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current || authorData.length === 0) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Chart dimensions
    const padding = 60;
    const chartWidth = canvas.width - padding * 2;
    const chartHeight = canvas.height - padding * 2;

    // Find max value for scaling
    const maxPosts = Math.max(...authorData.map(a => a.postCount));

    // Bar width
    const barWidth = chartWidth / authorData.length * 0.8;

    // Draw bars
    authorData.forEach((author, index) => {
      const barHeight = (author.postCount / maxPosts) * chartHeight;
      const x = padding + (index * chartWidth / authorData.length);
      const y = canvas.height - padding - barHeight;

      // Bar
      ctx.fillStyle = 'rgba(59, 130, 246, 0.8)';
      ctx.fillRect(x, y, barWidth, barHeight);

      // Author label (rotated)
      ctx.save();
      ctx.fillStyle = '#374151';
      ctx.font = '12px system-ui';
      ctx.textAlign = 'right';
      ctx.translate(x + barWidth / 2, canvas.height - padding + 20);
      ctx.rotate(-Math.PI / 4);
      ctx.fillText(author.author, 0, 0);
      ctx.restore();

      // Count label
      ctx.fillStyle = '#1f2937';
      ctx.font = '12px system-ui';
      ctx.textAlign = 'center';
      ctx.fillText(author.postCount.toString(), x + barWidth / 2, y - 5);
    });

    // Y-axis label
    ctx.fillStyle = '#6b7280';
    ctx.font = '14px system-ui';
    ctx.textAlign = 'center';
    ctx.save();
    ctx.translate(20, canvas.height / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText('Number of Posts', 0, 0);
    ctx.restore();

  }, [authorData]);

  if (authorData.length === 0) {
    return (
      <Card className="AuthorAnalysis">
        <CardHeader>
          <CardTitle>Authors with 10+ Disaster Posts</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-slate-500">No data available</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="AuthorAnalysis">
      <CardHeader>
        <CardTitle>Authors with 10+ Disaster Posts</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="chart-container">
          <canvas 
            ref={canvasRef} 
            width={800} 
            height={400}
            className="author-chart"
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default AuthorAnalysis;

// import { useRef } from "react";
// import { Bar } from 'react-chartjs-2';
// import { 
//   Chart as ChartJS, 
//   CategoryScale, 
//   LinearScale, 
//   BarElement, 
//   Title, 
//   Tooltip, 
//   Legend 
// } from 'chart.js';
// import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
// import './AuthorAnalysis.css';

// // Register Chart.js components
// ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

// type AuthorData = {
//   author: string;
//   postCount: number;
// };

// type Props = {
//   authorData: AuthorData[];
// };

// const AuthorAnalysis = ({ authorData }: Props) => {
//   const chartRef = useRef<any>(null);

//   // Prepare chart data
//   const chartData = {
//     labels: authorData.map(item => item.author),
//     datasets: [
//       {
//         label: 'Number of Posts',
//         data: authorData.map(item => item.postCount),
//         backgroundColor: 'rgba(59, 130, 246, 0.8)',
//         borderColor: 'rgba(59, 130, 246, 1)',
//         borderWidth: 1,
//       },
//     ],
//   };

//   const options = {
//     responsive: true,
//     maintainAspectRatio: false,
//     plugins: {
//       legend: {
//         position: 'top' as const,
//       },
//     },
//     scales: {
//       y: {
//         beginAtZero: true,
//         title: {
//           display: true,
//           text: 'Number of Posts'
//         }
//       },
//       x: {
//         title: {
//           display: true,
//           text: 'Authors'
//         },
//         ticks: {
//           maxRotation: 45,
//           minRotation: 45
//         }
//       }
//     },
//   };

//   return (
//     <Card className="AuthorAnalysis">
//       <CardHeader>
//         <CardTitle>Authors with 10+ Disaster Posts</CardTitle>
//       </CardHeader>
//       <CardContent>
//         <div className="chart-container">
//           <Bar ref={chartRef} data={chartData} options={options} />
//         </div>
//       </CardContent>
//     </Card>
//   );
// };

// export default AuthorAnalysis;