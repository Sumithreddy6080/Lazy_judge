import { useState, useEffect } from 'react';
import { getAllLeaderboards, getTeamAnalytics } from '../../services/judgeService';
import Loader from '../Loader';
import Modal from '../Modal';
import { getEventLabel } from '../../utils/helpers';
import { getMarkingSchema } from '../../utils/markingSchemas';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const JudgeLeaderboard = () => {
  const [leaderboards, setLeaderboards] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState('poster-presentation');
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [analytics, setAnalytics] = useState(null);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);

  const eventTypes = [
    { value: 'poster-presentation', label: 'Poster Presentation' },
    { value: 'paper-presentation', label: 'Paper Presentation' },
    { value: 'startup-expo', label: 'Startup Expo' },
  ];

  useEffect(() => {
    fetchLeaderboards();
  }, []);

  const fetchLeaderboards = async () => {
    try {
      const data = await getAllLeaderboards();
      setLeaderboards(data);
    } catch (error) {
      alert('Failed to fetch leaderboards');
    } finally {
      setLoading(false);
    }
  };

  const viewAnalytics = async (teamId) => {
    setLoadingAnalytics(true);
    setShowAnalytics(true);
    try {
      const data = await getTeamAnalytics(teamId);
      setAnalytics(data);
    } catch (error) {
      alert('Failed to fetch analytics');
      setShowAnalytics(false);
    } finally {
      setLoadingAnalytics(false);
    }
  };

  const downloadPDF = () => {
    if (!analytics) return;

    const doc = new jsPDF();
    const { team, evaluations } = analytics;
    const schema = getMarkingSchema(team.eventType);

    let yPos = 15;

    // Add watermark logo in center
    const logoImg = new Image();
    logoImg.src = '/AisummitLOGO.jpeg';
    try {
      const pageWidth = doc.internal.pageSize.width;
      const pageHeight = doc.internal.pageSize.height;
      const logoSize = 120; // Large watermark size
      const xCenter = (pageWidth - logoSize) / 2;
      const yCenter = (pageHeight - logoSize) / 2;
      
      // Add logo with transparency as watermark
      doc.saveGraphicsState();
      doc.setGState(new doc.GState({ opacity: 0.1 }));
      doc.addImage(logoImg, 'JPEG', xCenter, yCenter, logoSize, logoSize);
      doc.restoreGraphicsState();
    } catch (error) {
      console.warn('Watermark logo could not be loaded');
    }

    // Add Header image at top
    const headerImg = new Image();
    headerImg.src = '/header.jpeg';
    
    try {
      doc.addImage(headerImg, 'JPEG', 14, yPos, 180, 30);
    } catch (error) {
      console.warn('Header image could not be loaded');
    }
    
    yPos += 35;
    
    // Title
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    const pageWidth = doc.internal.pageSize.width;
    doc.text('GNITC AI SUMMIT TEAM EVALUATION REPORT', pageWidth / 2, yPos, { align: 'center' });
    
    yPos += 10;

    // Team Information Box
    doc.setFontSize(9);
    
    // First row: Team Name, Team Leader, No of Team
    const colWidth = 60;
    doc.setFont(undefined, 'bold');
    doc.text('TEAM NAME', 14, yPos);
    doc.text(':', 14 + colWidth, yPos);
    doc.setFont(undefined, 'normal');
    doc.text(team.name, 14 + colWidth + 5, yPos);
    
    yPos += 5;
    
    doc.setFont(undefined, 'bold');
    doc.text('EVENT', 14, yPos);
    doc.text(':', 14 + colWidth, yPos);
    doc.setFont(undefined, 'normal');
    doc.text(getEventLabel(team.eventType), 14 + colWidth + 5, yPos);
    
    doc.setFont(undefined, 'bold');
    doc.text('NO OF TEAM', 120, yPos);
    doc.text(':', 120 + 25, yPos);
    doc.setFont(undefined, 'normal');
    doc.text(team.totalMembers.toString(), 120 + 30, yPos);
    
    yPos += 5;
    
    doc.setFont(undefined, 'bold');
    doc.text('MEMBERS', 14, yPos);
    doc.text(':', 14 + colWidth, yPos);
    
    yPos += 7;

    // Team Members Section
    doc.setFont(undefined, 'bold');
    doc.text('TEAM MEMBERS:', 14, yPos);
    yPos += 5;
    
    // Team members table
    const memberTableData = team.members.map((member, idx) => [
      member.name,
      member.email || ''
    ]);
    
    doc.autoTable({
      head: [['TEAM MEMBERS NAMES', 'EMAIL ID']],
      body: memberTableData,
      startY: yPos,
      theme: 'grid',
      styles: {
        fontSize: 8,
        cellPadding: 2,
        lineWidth: 0.5,
        lineColor: 0,
      },
      headStyles: {
        fillColor: [255, 255, 255],
        textColor: 0,
        fontStyle: 'bold',
        lineWidth: 0.5,
        lineColor: 0,
      },
      columnStyles: {
        0: { cellWidth: 90 },
        1: { cellWidth: 100 },
      },
    });

    yPos = doc.lastAutoTable.finalY + 10;

    // Scoring Rubrics Section
    doc.setFontSize(10);
    doc.setFont(undefined, 'bold');
    doc.text('SCORING RUBRICS:-', 14, yPos);
    yPos += 7;

    // Prepare scoring table data
    const scoringHeaders = ['S.L', 'PARAMETERS'];
    const judgeNames = [...new Set(evaluations.map(e => e.judgeName))];
    
    // Add judge columns for Round 1
    judgeNames.forEach(name => {
      scoringHeaders.push(`JUDGE-\n${name.split(' ')[0]}`);
    });
    // Add judge columns for Round 2
    judgeNames.forEach(name => {
      scoringHeaders.push(`JUDGE-\n${name.split(' ')[0]}`);
    });
    scoringHeaders.push('TOTAL');

    const scoringData = schema.map((param, idx) => {
      const row = [
        (idx + 1).toString(),
        `${param.parameterName}(${param.maxScore})`
      ];
      
      // Round 1 scores for each judge
      judgeNames.forEach(judgeName => {
        const evaluation = evaluations.find(e => e.judgeName === judgeName);
        const round1 = evaluation?.rounds.find(r => r.roundNumber === 1);
        const score = round1?.questions.find(q => q.questionNumber === param.questionNumber)?.score || '-';
        row.push(score.toString());
      });
      
      // Round 2 scores for each judge
      judgeNames.forEach(judgeName => {
        const evaluation = evaluations.find(e => e.judgeName === judgeName);
        const round2 = evaluation?.rounds.find(r => r.roundNumber === 2);
        const score = round2?.questions.find(q => q.questionNumber === param.questionNumber)?.score || '-';
        row.push(score.toString());
      });
      
      // Calculate total for this parameter across all judges and rounds
      let total = 0;
      evaluations.forEach(evaluation => {
        const round1 = evaluation.rounds.find(r => r.roundNumber === 1);
        const round2 = evaluation.rounds.find(r => r.roundNumber === 2);
        const r1Score = round1?.questions.find(q => q.questionNumber === param.questionNumber)?.score || 0;
        const r2Score = round2?.questions.find(q => q.questionNumber === param.questionNumber)?.score || 0;
        total += r1Score + r2Score;
      });
      row.push(total.toString());
      
      return row;
    });

    // Calculate total marks
    const totalMarks = evaluations.reduce((sum, e) => sum + e.totalScore, 0);
    const maxMarks = schema.reduce((sum, param) => sum + param.maxScore, 0) * 2 * evaluations.length;

    doc.autoTable({
      head: [scoringHeaders],
      body: scoringData,
      startY: yPos,
      theme: 'grid',
      styles: {
        fontSize: 7,
        cellPadding: 2,
        halign: 'center',
        lineWidth: 0.5,
        lineColor: 0,
      },
      headStyles: {
        fillColor: [255, 255, 255],
        textColor: 0,
        fontStyle: 'bold',
        lineWidth: 0.5,
        lineColor: 0,
        halign: 'center',
      },
      columnStyles: {
        0: { cellWidth: 10 },
        1: { halign: 'left', cellWidth: 50 },
      },
    });

    yPos = doc.lastAutoTable.finalY + 5;

    // Total Marks
    doc.setFontSize(10);
    doc.setFont(undefined, 'bold');
    doc.text(`TOTAL MARKS:           / ${maxMarks}`, 14, yPos);
    
    yPos += 10;

    // Remarks Section
    doc.text('REMARKS:', 14, yPos);
    yPos += 7;

    doc.setFontSize(9);
    doc.setFont(undefined, 'normal');
    evaluations.forEach((evaluation) => {
      if (evaluation.remarks) {
        if (yPos > 250) {
          doc.addPage();
          yPos = 20;
        }
        doc.setFont(undefined, 'bold');
        doc.text(`${evaluation.judgeName}:`, 14, yPos);
        yPos += 5;
        doc.setFont(undefined, 'normal');
        const remarks = doc.splitTextToSize(evaluation.remarks, 180);
        doc.text(remarks, 20, yPos);
        yPos += remarks.length * 5 + 5;
      }
    });

    // Check if we need a new page for signatures
    if (yPos > 220) {
      doc.addPage();
      yPos = 20;
    } else {
      yPos += 10;
    }

    // Signature Section
    doc.setFontSize(9);
    doc.setFont(undefined, 'normal');
    
    const sigY = yPos;
    
    // Left signature
    doc.text('DR. MAMATHA TALAKOTI', 14, sigY);
    doc.text('Assoc. Prof | HoD-CSE | SNIST', 14, sigY + 5);
    
    // Middle signature
    doc.text('Dr. S. MADHU', 80, sigY);
    doc.text('HoD - CSM|CSO|AI&DS, GNITC', 73, sigY + 5);
    
    // Right signature
    doc.text('DR. P. PAVAN KUMAR', 155, sigY);
    doc.text('Asst. Prof AIML | GNITC', 155, sigY + 5);
    
    yPos = sigY + 15;

    // Footer logos
    try {
      const footerLogoImg = new Image();
      footerLogoImg.src = '/AisummitLOGO.jpeg';
      const aiSummitLogoImg = new Image();
      aiSummitLogoImg.src = '/AisummitLOGO.jpeg';
      
      doc.addImage(footerLogoImg, 'JPEG', 14, yPos, 20, 20);
      doc.setFontSize(8);
      doc.text('AI Summit', 37, yPos + 10);
      doc.text('2026', 37, yPos + 15);
    } catch (error) {
      console.warn('Footer logos could not be loaded');
    }

    doc.save(`${team.name}_Evaluation_Report.pdf`);
  };

  if (loading) return <Loader />;

  const currentLeaderboard = leaderboards[selectedEvent] || [];

  return (
    <div className="space-y-4 sm:space-y-6">
      <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Leaderboard</h2>

      {/* Event Selector */}
      <div className="flex flex-wrap gap-2">
        {eventTypes.map((event) => (
          <button
            key={event.value}
            onClick={() => setSelectedEvent(event.value)}
            className={`px-4 py-2 rounded-lg font-medium transition text-sm sm:text-base ${
              selectedEvent === event.value
                ? 'bg-primary-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            {event.label}
          </button>
        ))}
      </div>

      {/* Leaderboard */}
      <div className="card overflow-x-auto">
        <h3 className="text-xl font-semibold mb-4">{getEventLabel(selectedEvent)}</h3>
        {currentLeaderboard.length > 0 ? (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Rank
                </th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Team Name
                </th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Members
                </th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Round 1
                </th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Round 2
                </th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Total
                </th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {currentLeaderboard.map((team, index) => (
                <tr key={team.teamId} className={index < 3 ? 'bg-yellow-50' : ''}>
                  <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                    <span className="text-sm font-bold text-gray-900">
                      {index === 0 && '🥇'}
                      {index === 1 && '🥈'}
                      {index === 2 && '🥉'}
                      {index > 2 && `#${index + 1}`}
                    </span>
                  </td>
                  <td className="px-3 sm:px-6 py-4">
                    <span className="text-sm font-medium text-gray-900">{team.teamName}</span>
                  </td>
                  <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-500">{team.totalMembers}</span>
                  </td>
                  <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-900">{team.round1Marks}</span>
                  </td>
                  <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-900">{team.round2Marks}</span>
                  </td>
                  <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                    <span className="text-sm font-bold text-primary-600">{team.totalMarks}</span>
                  </td>
                  <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => viewAnalytics(team.teamId)}
                      className="text-sm text-primary-600 hover:text-primary-800 font-medium"
                    >
                      View Analytics
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="text-center text-gray-500 py-8">
            No teams evaluated for this event yet.
          </p>
        )}
      </div>

      {/* Analytics Modal */}
      <Modal
        isOpen={showAnalytics}
        onClose={() => {
          setShowAnalytics(false);
          setAnalytics(null);
        }}
        title="Team Analytics"
        size="xl"
      >
        {loadingAnalytics ? (
          <Loader message="Loading analytics..." />
        ) : analytics ? (
          <div className="space-y-6">
            {/* Team Info */}
            <div className="border-b pb-4">
              <h3 className="text-xl font-bold text-gray-900">{analytics.team.name}</h3>
              <p className="text-sm text-gray-600 mt-1">
                {getEventLabel(analytics.team.eventType)} • {analytics.team.totalMembers} members
              </p>
              <div className="mt-3">
                <p className="text-sm font-medium text-gray-700 mb-2">Team Members:</p>
                <div className="space-y-1">
                  {analytics.team.members.map((member, idx) => (
                    <p key={idx} className="text-sm text-gray-600">
                      {idx + 1}. {member.name} ({member.email})
                      {member.role && ` - ${member.role}`}
                    </p>
                  ))}
                </div>
              </div>
            </div>

            {/* Evaluations */}
            <div className="space-y-6">
              <h4 className="text-lg font-semibold text-gray-900">Judge Evaluations</h4>
              
              {/* Judge Evaluations Table */}
              <div className="overflow-x-auto border rounded-lg">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Judge Name
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase" colSpan="5">
                        Round 1 (Q1-Q5)
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                        R1 Total
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase" colSpan="5">
                        Round 2 (Q1-Q5)
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                        R2 Total
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                        Total
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {analytics.evaluations.map((evaluation, idx) => {
                      const round1 = evaluation.rounds.find(r => r.roundNumber === 1);
                      const round2 = evaluation.rounds.find(r => r.roundNumber === 2);
                      
                      return (
                        <tr key={idx} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm font-medium text-gray-900">
                            {evaluation.judgeName}
                          </td>
                          {/* Round 1 Questions */}
                          {round1 ? (
                            <>
                              {round1.questions.map((q) => (
                                <td key={`r1-q${q.questionNumber}`} className="px-2 py-3 text-center text-sm text-gray-700">
                                  {q.score}
                                </td>
                              ))}
                              <td className="px-4 py-3 text-center text-sm font-semibold text-primary-600">
                                {round1.totalScore}
                              </td>
                            </>
                          ) : (
                            <>
                              <td colSpan="5" className="px-2 py-3 text-center text-sm text-gray-400">-</td>
                              <td className="px-4 py-3 text-center text-sm text-gray-400">-</td>
                            </>
                          )}
                          {/* Round 2 Questions */}
                          {round2 && round2.questions.length > 0 ? (
                            <>
                              {round2.questions.map((q) => (
                                <td key={`r2-q${q.questionNumber}`} className="px-2 py-3 text-center text-sm text-gray-700">
                                  {q.score}
                                </td>
                              ))}
                              <td className="px-4 py-3 text-center text-sm font-semibold text-primary-600">
                                {round2.totalScore}
                              </td>
                            </>
                          ) : (
                            <>
                              <td colSpan="5" className="px-2 py-3 text-center text-sm text-gray-400">-</td>
                              <td className="px-4 py-3 text-center text-sm text-gray-400">-</td>
                            </>
                          )}
                          <td className="px-4 py-3 text-center text-sm font-bold text-primary-700">
                            {evaluation.totalScore}
                          </td>
                        </tr>
                      );
                    })}
                    {/* Average Row */}
                    <tr className="bg-primary-50 font-semibold">
                      <td className="px-4 py-3 text-sm text-gray-900">
                        Average
                      </td>
                      {/* Round 1 Average */}
                      {[1, 2, 3, 4, 5].map((qNum) => {
                        const scores = analytics.evaluations
                          .map(e => e.rounds.find(r => r.roundNumber === 1))
                          .filter(r => r)
                          .map(r => r.questions.find(q => q.questionNumber === qNum)?.score || 0);
                        const avg = scores.length > 0 ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1) : '-';
                        return (
                          <td key={`avg-r1-q${qNum}`} className="px-2 py-3 text-center text-sm text-primary-700">
                            {avg}
                          </td>
                        );
                      })}
                      <td className="px-4 py-3 text-center text-sm text-primary-700">
                        {(() => {
                          const round1Scores = analytics.evaluations
                            .map(e => e.rounds.find(r => r.roundNumber === 1))
                            .filter(r => r)
                            .map(r => r.totalScore);
                          return round1Scores.length > 0
                            ? (round1Scores.reduce((a, b) => a + b, 0) / round1Scores.length).toFixed(2)
                            : '-';
                        })()}
                      </td>
                      {/* Round 2 Average */}
                      {[1, 2, 3, 4, 5].map((qNum) => {
                        const scores = analytics.evaluations
                          .map(e => e.rounds.find(r => r.roundNumber === 2))
                          .filter(r => r && r.questions.length > 0)
                          .map(r => r.questions.find(q => q.questionNumber === qNum)?.score || 0);
                        const avg = scores.length > 0 ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1) : '-';
                        return (
                          <td key={`avg-r2-q${qNum}`} className="px-2 py-3 text-center text-sm text-primary-700">
                            {avg}
                          </td>
                        );
                      })}
                      <td className="px-4 py-3 text-center text-sm text-primary-700">
                        {(() => {
                          const round2Scores = analytics.evaluations
                            .map(e => e.rounds.find(r => r.roundNumber === 2))
                            .filter(r => r && r.questions.length > 0)
                            .map(r => r.totalScore);
                          return round2Scores.length > 0
                            ? (round2Scores.reduce((a, b) => a + b, 0) / round2Scores.length).toFixed(2)
                            : '-';
                        })()}
                      </td>
                      <td className="px-4 py-3 text-center text-sm font-bold text-primary-800">
                        {(() => {
                          const totalScores = analytics.evaluations.map(e => e.totalScore);
                          return totalScores.length > 0
                            ? (totalScores.reduce((a, b) => a + b, 0) / totalScores.length).toFixed(2)
                            : '-';
                        })()}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Remarks Section */}
              <div className="space-y-3">
                <h5 className="font-semibold text-gray-900">Judge Remarks</h5>
                {analytics.evaluations.map((evaluation, idx) => (
                  evaluation.remarks && (
                    <div key={idx} className="border-l-4 border-primary-500 pl-4 py-2 bg-gray-50">
                      <p className="text-sm font-medium text-gray-700">{evaluation.judgeName}:</p>
                      <p className="text-sm text-gray-600 mt-1">{evaluation.remarks}</p>
                    </div>
                  )
                ))}
                {!analytics.evaluations.some(e => e.remarks) && (
                  <p className="text-sm text-gray-500 italic">No remarks provided</p>
                )}
              </div>
            </div>

            <button onClick={downloadPDF} className="w-full btn-primary">
              Download PDF Report
            </button>
          </div>
        ) : null}
      </Modal>
    </div>
  );
};

export default JudgeLeaderboard;
