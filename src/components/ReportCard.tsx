import { forwardRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

interface Mark {
  id: string;
  score: number;
  grade?: string;
  remarks?: string;
  subject: {
    id: string;
    name: string;
    code: string;
    level: string;
  };
  exam_period: {
    id: string;
    name: string;
    term: number;
    start_date?: string;
    end_date?: string;
  };
}

interface StudentReportData {
  student: {
    id: string;
    full_name: string;
    admission_number: string;
    grade: string;
    stream?: string;
  };
  marks: Mark[];
  overallAverage: number;
  classRank: number;
  streamRank: number;
  totalStudents: number;
  recommendations: string;
}

interface ReportCardProps {
  data: StudentReportData;
  institutionName?: string;
}

const getScoreBasedRemark = (score: number) => {
  if (score >= 90) return "Keep up the excellence.";
  if (score >= 80) return "Great job, stay focused.";
  if (score >= 70) return "Well done, aim higher.";
  if (score >= 60) return "Work harder next time.";
  if (score >= 50) return "Keep trying, don't quit.";
  return "Work hard, seek help.";
};

const getCBCGrade = (score: number, level: string) => {
  const isJuniorSecondary = level === 'junior_secondary';
  
  if (isJuniorSecondary) {
    if (score >= 80) return { label: "Exceeding Expectations", color: "success", points: "A" };
    if (score >= 70) return { label: "Exceeding Expectations 2", color: "success", points: "A-" };
    if (score >= 58) return { label: "Meeting Expectations 1", color: "secondary", points: "B+" };
    if (score >= 46) return { label: "Meeting Expectations 2", color: "secondary", points: "B" };
    if (score >= 38) return { label: "Approaching Expectation 1", color: "warning", points: "C+" };
    if (score >= 30) return { label: "Approaching Expectation 2", color: "warning", points: "C" };
    if (score >= 15) return { label: "Below Expectation 1", color: "destructive", points: "D+" };
    return { label: "Below Expectation 2", color: "destructive", points: "D" };
  } else {
    if (score >= 70) return { label: "Exceeding Expectations", color: "success", points: "4" };
    if (score >= 46) return { label: "Meeting Expectations", color: "secondary", points: "3" };
    if (score >= 30) return { label: "Approaching Expectation", color: "warning", points: "2" };
    return { label: "Below Expectation", color: "destructive", points: "1" };
  }
};

const generatePersonalizedAdvice = (marks: Mark[], overallAverage: number) => {
  const subjects = marks.map(mark => ({
    name: mark.subject.name,
    score: mark.score,
    level: mark.subject.level
  }));

  const excellentSubjects = subjects.filter(s => s.score >= 80);
  const goodSubjects = subjects.filter(s => s.score >= 60 && s.score < 80);
  const improvementSubjects = subjects.filter(s => s.score < 50);

  let advice = "";

  if (overallAverage >= 80) {
    advice = "Excellent performance! You are excelling across all subjects. ";
    if (excellentSubjects.length > 0) {
      advice += `Continue your outstanding work in ${excellentSubjects.map(s => s.name).join(", ")}. `;
    }
    advice += "Consider taking on leadership roles and helping fellow students.";
  } else if (overallAverage >= 65) {
    advice = "Good performance overall. ";
    if (excellentSubjects.length > 0) {
      advice += `Excellent work in ${excellentSubjects.map(s => s.name).join(", ")}. `;
    }
    if (improvementSubjects.length > 0) {
      advice += `Focus on improving in ${improvementSubjects.map(s => s.name).join(", ")} through extra practice and seeking help when needed.`;
    }
  } else if (overallAverage >= 50) {
    advice = "You're making progress! ";
    if (goodSubjects.length > 0) {
      advice += `Build on your strengths in ${goodSubjects.map(s => s.name).join(", ")}. `;
    }
    if (improvementSubjects.length > 0) {
      advice += `Dedicate more time to ${improvementSubjects.map(s => s.name).join(", ")}. Consider forming study groups and asking teachers for additional support.`;
    }
  } else {
    advice = "There's room for significant improvement. ";
    advice += "Meet with your teachers regularly, create a structured study schedule, and don't hesitate to ask for help. ";
    if (goodSubjects.length > 0) {
      advice += `Use your understanding in ${goodSubjects.map(s => s.name).join(", ")} as a foundation to improve other areas.`;
    }
  }

  return advice;
};

const ReportCard = forwardRef<HTMLDivElement, ReportCardProps>(
  ({ data, institutionName = "CBC Academic Institution" }, ref) => {
    const currentDate = new Date();
    const academicYear = `${currentDate.getFullYear()}/${currentDate.getFullYear() + 1}`;

    const groupedMarks = data.marks.reduce((acc, mark) => {
      const examName = mark.exam_period.name;
      if (!acc[examName]) {
        acc[examName] = [];
      }
      acc[examName].push(mark);
      return acc;
    }, {} as Record<string, Mark[]>);

    return (
      <div 
        ref={ref} 
        className="bg-white text-black p-8 min-h-screen font-serif"
        style={{ 
          printColorAdjust: 'exact',
          WebkitPrintColorAdjust: 'exact'
        }}
      >
        {/* Header */}
        <div className="text-center border-b-2 border-blue-800 pb-6 mb-8">
          <h1 className="text-2xl font-bold text-blue-800 mb-2">{institutionName}</h1>
          <h2 className="text-xl font-semibold text-gray-700 mb-2">COMPETENCY BASED CURRICULUM (CBC)</h2>
          <h3 className="text-lg font-semibold text-gray-600">STUDENT REPORT CARD</h3>
          <p className="text-sm text-gray-500 mt-2">Academic Year: {academicYear}</p>
        </div>

        {/* Student Information */}
        <div className="grid grid-cols-2 gap-8 mb-8">
          <div className="space-y-3">
            <div className="flex">
              <span className="font-semibold w-32">Student Name:</span>
              <span className="border-b border-gray-400 flex-1 pl-2">{data.student.full_name}</span>
            </div>
            <div className="flex">
              <span className="font-semibold w-32">Admission No:</span>
              <span className="border-b border-gray-400 flex-1 pl-2">{data.student.admission_number}</span>
            </div>
            <div className="flex">
              <span className="font-semibold w-32">Class:</span>
              <span className="border-b border-gray-400 flex-1 pl-2">Grade {data.student.grade}</span>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex">
              <span className="font-semibold w-32">Stream:</span>
              <span className="border-b border-gray-400 flex-1 pl-2">{data.student.stream || 'N/A'}</span>
            </div>
            <div className="flex">
              <span className="font-semibold w-32">Class Position:</span>
              <span className="border-b border-gray-400 flex-1 pl-2 font-semibold">
                Position {data.classRank} out of {data.totalStudents} students
              </span>
            </div>
            {data.student.stream && data.streamRank && (
              <div className="flex">
                <span className="font-semibold w-32">Stream Position:</span>
                <span className="border-b border-gray-400 flex-1 pl-2 font-semibold">
                  Position {data.streamRank} in {data.student.stream} stream
                </span>
              </div>
            )}
            <div className="flex">
              <span className="font-semibold w-32">Overall Average:</span>
              <span className="border-b border-gray-400 flex-1 pl-2 font-bold text-blue-800">
                {data.overallAverage.toFixed(1)}%
              </span>
            </div>
          </div>
        </div>

        {/* Academic Performance */}
        <div className="mb-8">
          <h4 className="text-lg font-semibold text-blue-800 mb-4 border-b border-gray-300 pb-2">
            ACADEMIC PERFORMANCE
          </h4>
          
          {Object.entries(groupedMarks).map(([examName, marks]) => (
            <div key={examName} className="mb-6">
              <h5 className="font-semibold text-gray-700 mb-3 bg-gray-100 p-2 rounded">
                {examName}
              </h5>
              
              <table className="w-full border-collapse border border-gray-400 text-sm">
                <thead>
                  <tr className="bg-gray-200">
                    <th className="border border-gray-400 p-2 text-left">Subject</th>
                    <th className="border border-gray-400 p-2 text-center">Score</th>
                    <th className="border border-gray-400 p-2 text-center">Grade</th>
                    <th className="border border-gray-400 p-2 text-left">Performance Band</th>
                    <th className="border border-gray-400 p-2 text-left">Remarks</th>
                  </tr>
                </thead>
                <tbody>
                  {marks.map((mark) => {
                    const grade = getCBCGrade(mark.score, mark.subject.level);
                    return (
                      <tr key={mark.id}>
                        <td className="border border-gray-400 p-2">{mark.subject.name}</td>
                        <td className="border border-gray-400 p-2 text-center font-semibold">
                          {mark.score}%
                        </td>
                        <td className="border border-gray-400 p-2 text-center font-semibold">
                          {grade.points}
                        </td>
                        <td className="border border-gray-400 p-2">
                          <span className={`px-2 py-1 rounded text-xs font-medium
                            ${grade.color === 'success' ? 'bg-green-100 text-green-800' : ''}
                            ${grade.color === 'secondary' ? 'bg-blue-100 text-blue-800' : ''}
                            ${grade.color === 'warning' ? 'bg-yellow-100 text-yellow-800' : ''}
                            ${grade.color === 'destructive' ? 'bg-red-100 text-red-800' : ''}
                          `}>
                            {grade.label}
                          </span>
                        </td>
                        <td className="border border-gray-400 p-2">
                          {mark.remarks || getScoreBasedRemark(mark.score)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ))}
        </div>

        {/* CBC Grading System */}
        <div className="mb-8">
          <h4 className="text-lg font-semibold text-blue-800 mb-4 border-b border-gray-300 pb-2">
            CBC GRADING SYSTEM
          </h4>
          
          <div className="grid grid-cols-2 gap-6">
            <div>
              <h5 className="font-semibold text-gray-700 mb-2">Upper Primary (Grades 4-6)</h5>
              <table className="w-full border-collapse border border-gray-400 text-xs">
                <thead>
                  <tr className="bg-gray-200">
                    <th className="border border-gray-400 p-1">Score Range</th>
                    <th className="border border-gray-400 p-1">Grade</th>
                    <th className="border border-gray-400 p-1">Performance Level</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-gray-400 p-1">70-100%</td>
                    <td className="border border-gray-400 p-1">4</td>
                    <td className="border border-gray-400 p-1">Exceeding Expectations</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-400 p-1">46-69%</td>
                    <td className="border border-gray-400 p-1">3</td>
                    <td className="border border-gray-400 p-1">Meeting Expectations</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-400 p-1">30-45%</td>
                    <td className="border border-gray-400 p-1">2</td>
                    <td className="border border-gray-400 p-1">Approaching Expectation</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-400 p-1">0-29%</td>
                    <td className="border border-gray-400 p-1">1</td>
                    <td className="border border-gray-400 p-1">Below Expectation</td>
                  </tr>
                </tbody>
              </table>
            </div>
            
            <div>
              <h5 className="font-semibold text-gray-700 mb-2">Junior Secondary (Grades 7-9)</h5>
              <table className="w-full border-collapse border border-gray-400 text-xs">
                <thead>
                  <tr className="bg-gray-200">
                    <th className="border border-gray-400 p-1">Score Range</th>
                    <th className="border border-gray-400 p-1">Grade</th>
                    <th className="border border-gray-400 p-1">Performance Level</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-gray-400 p-1">80-100%</td>
                    <td className="border border-gray-400 p-1">A</td>
                    <td className="border border-gray-400 p-1">Exceeding Expectations</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-400 p-1">70-79%</td>
                    <td className="border border-gray-400 p-1">A-</td>
                    <td className="border border-gray-400 p-1">Exceeding Expectations 2</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-400 p-1">58-69%</td>
                    <td className="border border-gray-400 p-1">B+</td>
                    <td className="border border-gray-400 p-1">Meeting Expectations 1</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-400 p-1">46-57%</td>
                    <td className="border border-gray-400 p-1">B</td>
                    <td className="border border-gray-400 p-1">Meeting Expectations 2</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-400 p-1">38-45%</td>
                    <td className="border border-gray-400 p-1">C+</td>
                    <td className="border border-gray-400 p-1">Approaching Expectation 1</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-400 p-1">30-37%</td>
                    <td className="border border-gray-400 p-1">C</td>
                    <td className="border border-gray-400 p-1">Approaching Expectation 2</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Personalized Recommendations */}
        <div className="mb-8">
          <h4 className="text-lg font-semibold text-blue-800 mb-4 border-b border-gray-300 pb-2">
            PERSONALIZED RECOMMENDATIONS
          </h4>
          <div className="bg-gray-50 p-4 rounded-lg border">
            <p className="text-sm leading-relaxed">
              {generatePersonalizedAdvice(data.marks, data.overallAverage)}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 pt-6 border-t-2 border-gray-300">
          <div className="grid grid-cols-3 gap-8 text-center">
            <div>
              <div className="border-t border-gray-400 pt-2 mt-8">
                <p className="text-sm font-semibold">Class Teacher</p>
                <p className="text-xs text-gray-600">Signature & Date</p>
              </div>
            </div>
            <div>
              <div className="border-t border-gray-400 pt-2 mt-8">
                <p className="text-sm font-semibold">Head Teacher</p>
                <p className="text-xs text-gray-600">Signature & Date</p>
              </div>
            </div>
            <div>
              <div className="border-t border-gray-400 pt-2 mt-8">
                <p className="text-sm font-semibold">Parent/Guardian</p>
                <p className="text-xs text-gray-600">Signature & Date</p>
              </div>
            </div>
          </div>
          
          <div className="text-center mt-6">
            <p className="text-xs text-gray-500">
              Generated on {format(new Date(), 'PPP')} | CBC Academic Record System
            </p>
          </div>
        </div>
      </div>
    );
  }
);

ReportCard.displayName = "ReportCard";

export default ReportCard;