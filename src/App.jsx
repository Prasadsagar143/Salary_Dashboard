import React, { useState, useEffect } from 'react';
import Papa from 'papaparse';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSortUp, faSortDown, faSort } from '@fortawesome/free-solid-svg-icons';
import './App.css';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

function App() {
  const [salaryData, setSalaryData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [sortConfig, setSortConfig] = useState({ key: 'year', direction: 'ascending' });
  const [selectedYear, setSelectedYear] = useState(null);
  const [jobTitles, setJobTitles] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [jobsPerPage] = useState(5);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetch('/salary.csv') // Ensure the CSV is in the public folder
      .then(response => response.text())
      .then(data => {
        const parsedData = Papa.parse(data, { header: true }).data;
        const processedData = parsedData.map((row) => ({
          ...row,
          year: Number(row.year),
          totalJobs: isNaN(Number(row.totalJobs)) ? 0 : Number(row.totalJobs), // Ensure totalJobs is a number, default to 0 if invalid
          avgSalaryUSD: Number(row.avgSalaryUSD)
        }));

        setSalaryData(processedData);
        setFilteredData(processedData);
      });
  }, []);

  const sortedData = [...filteredData].sort((a, b) => {
    const aValue = a[sortConfig.key];
    const bValue = b[sortConfig.key];

    if (aValue < bValue) {
      return sortConfig.direction === 'ascending' ? -1 : 1;
    }
    if (aValue > bValue) {
      return sortConfig.direction === 'ascending' ? 1 : -1;
    }
    return 0;
  });

  // Get current jobs for pagination
  const indexOfLastJob = currentPage * jobsPerPage;
  const indexOfFirstJob = indexOfLastJob - jobsPerPage;
  const currentJobs = sortedData.slice(indexOfFirstJob, indexOfLastJob);

  const handleSort = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const handleRowClick = (year) => {
    setSelectedYear(year);

    // Filter data for the selected year and aggregate job titles
    const titlesForYear = salaryData.filter((item) => item.year === year);
    const aggregatedTitles = titlesForYear.reduce((acc, curr) => {
      acc[curr.jobTitle] = (acc[curr.jobTitle] || 0) + 1;
      return acc;
    }, {});

    // Convert the aggregated data to an array of objects
    setJobTitles(Object.entries(aggregatedTitles).map(([jobtitle, count]) => ({ jobtitle, count })));
  };

  // Pagination logic
  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  // Search functionality
  const handleSearch = (event) => {
    const searchTerm = event.target.value.toLowerCase();
    setSearchTerm(searchTerm);

    const filtered = salaryData.filter((item) =>
      item.year.toString().includes(searchTerm) ||
      item.totalJobs.toString().includes(searchTerm) ||
      item.avgSalaryUSD.toString().includes(searchTerm)||
      item.jobtitle.toString().includes(searchTerm)
    );

    setFilteredData(filtered);
  };

  // Data for the line graph
  // Prepare data for the line graph
  const uniqueYears = salaryData.map((item) => item.year).filter((value, index, self) => self.indexOf(value) === index);

  const totalJobsPerYear = uniqueYears.map((year) => {
    const jobsInYear = salaryData.filter((item) => item.year === year);
    const totalJobs = jobsInYear.reduce((acc, item) => acc + item.totalJobs, 0);
    return totalJobs;
  });

  const lineData = {
    labels: uniqueYears, // Labels for the X-axis (Years)
    datasets: [
      {
        label: 'Total Jobs',
        data: totalJobsPerYear, // Data points for total jobs
        fill: false,
        borderColor: 'rgba(75, 192, 192, 1)',
        tension: 0.1, // Line smoothing
      },
    ],
  };

  return (
    <div className="container">
      <h1>ML Engineer Salaries (2020-2024)</h1>
      <Line data={lineData} />

      {/* Search bar */}
      <div className="search-container">
        <input
          type="text"
          className="search-input"
          placeholder="Search by year, jobs or salary..."
          value={searchTerm}
          onChange={handleSearch}
        />
      </div>

      {/* Main Table */}
      <table>
        <thead>
          <tr>
            <th onClick={() => handleSort('year')}>
              Year
              {sortConfig.key === 'year' ? (
                sortConfig.direction === 'ascending' ? (
                  <FontAwesomeIcon icon={faSortUp} />
                ) : (
                  <FontAwesomeIcon icon={faSortDown} />
                )
              ) : (
                <FontAwesomeIcon icon={faSort} />
              )}
            </th>
            <th onClick={() => handleSort('totalJobs')}>
              Total Jobs
              {sortConfig.key === 'totalJobs' ? (
                sortConfig.direction === 'ascending' ? (
                  <FontAwesomeIcon icon={faSortUp} />
                ) : (
                  <FontAwesomeIcon icon={faSortDown} />
                )
              ) : (
                <FontAwesomeIcon icon={faSort} />
              )}
            </th>
            <th onClick={() => handleSort('avgSalaryUSD')}>
              Average Salary (USD)
              {sortConfig.key === 'avgSalaryUSD' ? (
                sortConfig.direction === 'ascending' ? (
                  <FontAwesomeIcon icon={faSortUp} />
                ) : (
                  <FontAwesomeIcon icon={faSortDown} />
                )
              ) : (
                <FontAwesomeIcon icon={faSort} />
              )}
            </th>
            <th onClick={() => handleSort('jobtitle')}>
              Job Title
              {sortConfig.key === 'jobtitle' ? (
                sortConfig.direction === 'ascending' ? (
                  <FontAwesomeIcon icon={faSortUp} />
                ) : (
                  <FontAwesomeIcon icon={faSortDown} />
                )
              ) : (
                <FontAwesomeIcon icon={faSort} />
              )}
            </th>
          </tr>
        </thead>
        <tbody>
          {currentJobs.map((item, index) => (
            <tr key={index} onClick={() => handleRowClick(item.year)}>
              <td>{item.year}</td>
              <td>{item.totalJobs}</td>
              <td>{item.avgSalaryUSD}</td>
              <td>{item.jobtitle}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Pagination */}
      <div className="pagination">
        {Array.from({ length: Math.ceil(filteredData.length / jobsPerPage) }, (_, i) => (
          <button
            key={i}
            onClick={() => paginate(i + 1)}
            className={i + 1 === currentPage ? 'active' : ''}
          >
            {i + 1}
          </button>
        ))}
      </div>

      {/* Second Table showing aggregated job titles for the selected year */}
      {selectedYear && (
        <div>
          <h2>Job Titles for {selectedYear}</h2>
          <table>
            <thead>
              <tr>
                <th>Job Title</th>
                <th>Count</th>
              </tr>
            </thead>
            <tbody>
              {jobTitles.map((job, index) => (
                <tr key={index}>
                  <td>{job.jobtitle}</td>
                  <td>{job.count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default App;
