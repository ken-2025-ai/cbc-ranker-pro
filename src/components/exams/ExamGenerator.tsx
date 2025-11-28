import { useState, useEffect } from "react";
import {
  generateAESKey,
  encryptExamData,
  exportAESKey,
  encryptAESKey,
} from "@/utils/crypto";
import {
  initializeDevice,
  getDevicePublicKey,
  getDevicePublicKeyString,
} from "@/utils/deviceManager";
import { storeEncryptedExam } from "@/utils/examStorage";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Loader2, Sparkles, ChevronDown, ChevronRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Checkbox } from "@/components/ui/checkbox";
import { getTopicsForClass, getStrandsForClass } from "@/data/examTopicsConfig";

// PP1/PP2 specific subjects
const PP_SUBJECTS = [
  { name: "Literacy Activities", code: "LIT" },
  { name: "Mathematical Activities", code: "MATH" },
  { name: "Environmental Activities", code: "ENV" },
  { name: "Hygiene and Nutrition Activities", code: "HYG" },
  { name: "Religious Education Activities", code: "CRE" },
  { name: "Movement and Creative Activities", code: "MCA" },
];

const CLASS_LEVELS = [
  "PP1", "PP2", "Grade 1", "Grade 2", "Grade 3", "Grade 4",
  "Grade 5", "Grade 6", "Grade 7", "Grade 8", "Grade 9",
  "Form 1", "Form 2", "Form 3", "Form 4"
];

const EXAM_TYPES = [
  "KPSEA", "KJSEA", "End Term", "Mid Term", "Mock", "Opener", "CAT"
];

interface Subject {
  id: string;
  name: string;
  code: string;
  level: string;
}

const ExamGenerator = () => {
  const { toast } = useToast();
  const { institution, institutionId } = useAuth();
  const [availableSubjects, setAvailableSubjects] = useState<Subject[]>([]);
  
  const [formData, setFormData] = useState({
    school_name: institution?.name || "",
    class_level: "",
    exam_type: "",
    subject: "",
    paper_number: 1,
    term: 1,
    year: new Date().getFullYear(),
    teacher_name: "",
    time_allowed_minutes: 60,
    question_count: 10,
    strands: [] as string[],
    covered_topics: {} as Record<string, string[]>, // Topics teacher has covered
    include_omr: false,
    include_diagrams: false,
    extra_instructions: "",
    difficulty: { easy: 40, medium: 40, hard: 20 }
  });

  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedExamId, setGeneratedExamId] = useState<string | null>(null);
  const [expandedStrands, setExpandedStrands] = useState<Set<string>>(new Set());

  // Get class-specific and paper-specific topics
  const availableTopics = formData.subject && formData.class_level
    ? getTopicsForClass(
        formData.subject, 
        formData.class_level,
        // Only filter by paper for KPSEA (Grade 6) and KJSEA (Grade 9) exams
        (formData.exam_type === "KPSEA" || formData.exam_type === "KJSEA") ? formData.paper_number : undefined
      )
    : {};

  const availableStrands = availableTopics ? Object.keys(availableTopics) : [];

  const toggleStrand = (strand: string) => {
    const newExpanded = new Set(expandedStrands);
    if (newExpanded.has(strand)) {
      newExpanded.delete(strand);
    } else {
      newExpanded.add(strand);
    }
    setExpandedStrands(newExpanded);
  };

  const handleStrandToggle = (strand: string, checked: boolean) => {
    if (checked) {
      // Select all topics in this strand
      const topics = availableTopics[strand] || [];
      setFormData({
        ...formData,
        strands: [...formData.strands, strand],
        covered_topics: {
          ...formData.covered_topics,
          [strand]: topics
        }
      });
    } else {
      // Deselect strand and all its topics
      const newCoveredTopics = { ...formData.covered_topics };
      delete newCoveredTopics[strand];
      setFormData({
        ...formData,
        strands: formData.strands.filter(s => s !== strand),
        covered_topics: newCoveredTopics
      });
    }
  };

  const handleTopicToggle = (strand: string, topic: string, checked: boolean) => {
    const currentTopics = formData.covered_topics[strand] || [];
    let newTopics: string[];
    
    if (checked) {
      newTopics = [...currentTopics, topic];
    } else {
      newTopics = currentTopics.filter(t => t !== topic);
    }

    const newCoveredTopics = {
      ...formData.covered_topics,
      [strand]: newTopics
    };

    // If no topics left in strand, remove strand from strands array
    const newStrands = newTopics.length > 0 
      ? (formData.strands.includes(strand) ? formData.strands : [...formData.strands, strand])
      : formData.strands.filter(s => s !== strand);

    setFormData({
      ...formData,
      strands: newStrands,
      covered_topics: newCoveredTopics
    });
  };

  // Map class level to subject level
  const getSubjectLevel = (classLevel: string): string => {
    if (classLevel === "PP1" || classLevel === "PP2") return "pre_primary";
    const grade = parseInt(classLevel.replace(/\D/g, ""));
    if (!isNaN(grade)) {
      if (grade <= 3) return "lower_primary";
      if (grade <= 6) return "upper_primary";
      if (grade <= 9) return "junior_secondary";
    }
    if (classLevel.startsWith("Form")) return "secondary";
    return "upper_primary";
  };

  // Fetch subjects when class level changes
  useEffect(() => {
    if (!formData.class_level) {
      setAvailableSubjects([]);
      return;
    }

    const fetchSubjects = async () => {
      const level = getSubjectLevel(formData.class_level);
      
      // For PP1/PP2, use dedicated subjects
      if (level === "pre_primary") {
        setAvailableSubjects(PP_SUBJECTS.map((s, idx) => ({
          id: s.code,
          name: s.name,
          code: s.code,
          level: "pre_primary"
        })));
        return;
      }

      // Fetch from database for other levels
      try {
        const { data, error } = await supabase
          .from('subjects')
          .select('*')
          .eq('level', level)
          .order('name');
        
        if (error) throw error;
        
        // Remove duplicates by subject name
        const uniqueSubjects = Array.from(
          new Map((data || []).map(subject => [subject.name, subject])).values()
        );
        
        setAvailableSubjects(uniqueSubjects);
      } catch (error) {
        console.error('Error fetching subjects:', error);
        toast({
          title: "Error",
          description: "Failed to load subjects for this class level",
          variant: "destructive"
        });
      }
    };

    fetchSubjects();
  }, [formData.class_level, institutionId]);

  const handleGenerate = async () => {
    // Check if any topics are selected
    const hasTopics = Object.values(formData.covered_topics).some(topics => topics.length > 0);
    
    if (!formData.class_level || !formData.exam_type || !formData.subject || !hasTopics) {
      toast({
        title: "Missing Fields",
        description: "Please fill in class level, exam type, subject, and select at least one topic you have covered",
        variant: "destructive"
      });
      return;
    }

    // Prepare strands array from covered topics
    const strandsArray = Object.keys(formData.covered_topics).filter(
      strand => formData.covered_topics[strand].length > 0
    );

    setIsGenerating(true);
    
    try {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      
      if (userError || !userData.user) {
        toast({
          title: "Authentication Error",
          description: "Please log in to generate exams",
          variant: "destructive"
        });
        setIsGenerating(false);
        return;
      }
      
      const payload = {
        ...formData,
        strands: strandsArray,
        owner_id: userData.user.id,
        institution_id: institutionId || institution?.id
      };

      console.log('Generating exam with payload:', {
        subject: payload.subject,
        class_level: payload.class_level,
        covered_topics: payload.covered_topics,
        strands: payload.strands
      });

      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        toast({
          title: "Session Error",
          description: "Your session has expired. Please refresh and try again.",
          variant: "destructive"
        });
        setIsGenerating(false);
        return;
      }
      
      const response = await fetch(
        `https://tzdpqwkbkuqypzzuphmt.supabase.co/functions/v1/generate-exam`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session?.access_token || ''}`
          },
          body: JSON.stringify(payload)
        }
      );

      if (response.status === 402) {
        toast({
          title: "Payment Required",
          description: "Please add credits to your Lovable AI workspace to use this feature. Visit Settings → Workspace → Usage to add credits.",
          variant: "destructive",
          duration: 10000
        });
        setIsGenerating(false);
        return;
      }

      if (response.status === 429) {
        toast({
          title: "Rate Limited",
          description: "Too many exam generation requests. Please wait a moment and try again, or upgrade your plan for higher limits.",
          variant: "destructive",
          duration: 8000
        });
        setIsGenerating(false);
        return;
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('API Error:', response.status, errorData);
        throw new Error(errorData.error || `API error: ${response.status}`);
      }

      // Stream the response
      const reader = response.body?.getReader();
      if (!reader) throw new Error('No response body');

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
      }

      toast({
        title: "Exam Generated!",
        description: "Your exam has been generated successfully. Check Exam History to view and download it.",
      });

      console.log('Exam generation completed successfully');
      
      // Reset form but keep school info
      setFormData(prev => ({
        ...prev,
        covered_topics: {},
        strands: [],
        extra_instructions: ""
      }));
      setExpandedStrands(new Set());

      // Refresh to show in history
      setTimeout(() => {
        window.location.reload();
      }, 1500);

    } catch (error) {
      console.error('Error generating exam:', error);
      const errorMessage = error instanceof Error ? error.message : "Failed to generate exam";
      
      toast({
        title: "Generation Failed",
        description: errorMessage.includes("Payment") 
          ? "Please add credits to your Lovable AI workspace"
          : errorMessage.includes("Rate limit")
          ? "Too many requests. Please try again in a few minutes"
          : errorMessage.includes("Authentication")
          ? "Please log in again to continue"
          : "An error occurred while generating the exam. Please try again.",
        variant: "destructive",
        duration: 8000
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          Generate KNEC/CBC Exam with Lovable AI
        </CardTitle>
        <CardDescription>
          Configure your exam parameters and generate AI-powered KNEC-compliant exams using advanced AI
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* AI Info Banner */}
        <div className="bg-gradient-to-r from-primary/10 via-accent/10 to-primary/10 p-4 rounded-lg border border-primary/20">
          <div className="flex items-start gap-3">
            <Sparkles className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
            <div className="space-y-1">
              <p className="text-sm font-medium">Powered by Lovable AI</p>
              <p className="text-xs text-muted-foreground">
                Our AI generates curriculum-aligned exams based on the specific topics you've covered, ensuring questions match your teaching progression and follow official CBC/KNEC guidelines.
              </p>
            </div>
          </div>
        </div>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="school_name">School Name</Label>
            <Input
              id="school_name"
              value={formData.school_name}
              onChange={(e) => setFormData({ ...formData, school_name: e.target.value })}
              placeholder="Enter school name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="class_level">Class Level *</Label>
            <Select value={formData.class_level} onValueChange={(value) => setFormData({ 
              ...formData, 
              class_level: value,
              // Clear topics when class changes since different classes have different topics
              covered_topics: {},
              strands: []
            })}>
              <SelectTrigger>
                <SelectValue placeholder="Select class" />
              </SelectTrigger>
              <SelectContent>
                {CLASS_LEVELS.map((level) => (
                  <SelectItem key={level} value={level}>{level}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="exam_type">Exam Type *</Label>
            <Select value={formData.exam_type} onValueChange={(value) => setFormData({ ...formData, exam_type: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Select exam type" />
              </SelectTrigger>
              <SelectContent>
                {EXAM_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>{type}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="term">Term *</Label>
            <Select value={formData.term.toString()} onValueChange={(value) => setFormData({ ...formData, term: parseInt(value) })}>
              <SelectTrigger>
                <SelectValue placeholder="Select term" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">Term 1</SelectItem>
                <SelectItem value="2">Term 2</SelectItem>
                <SelectItem value="3">Term 3</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="year">Year</Label>
            <Input
              id="year"
              type="number"
              min="2020"
              max="2030"
              value={formData.year}
              onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) || new Date().getFullYear() })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="teacher_name">Teacher Name (Optional)</Label>
            <Input
              id="teacher_name"
              value={formData.teacher_name}
              onChange={(e) => setFormData({ ...formData, teacher_name: e.target.value })}
              placeholder="Enter teacher name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="subject">Subject *</Label>
            <Select 
              value={formData.subject} 
              onValueChange={(value) => setFormData({ 
                ...formData, 
                subject: value, 
                strands: [],
                // Clear topics when subject changes
                covered_topics: {}
              })}
              disabled={!formData.class_level}
            >
              <SelectTrigger>
                <SelectValue placeholder={formData.class_level ? "Select subject" : "Select class first"} />
              </SelectTrigger>
              <SelectContent>
                {availableSubjects.map((subject) => (
                  <SelectItem key={subject.id} value={subject.name}>{subject.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="paper_number">Paper Number</Label>
            <Select 
              value={formData.paper_number.toString()} 
              onValueChange={(value) => setFormData({ 
                ...formData, 
                paper_number: parseInt(value),
                // Clear selected topics when paper changes for KPSEA/KJSEA
                covered_topics: (formData.exam_type === "KPSEA" || formData.exam_type === "KJSEA") 
                  ? {} 
                  : formData.covered_topics,
                strands: (formData.exam_type === "KPSEA" || formData.exam_type === "KJSEA") 
                  ? [] 
                  : formData.strands
              })}
              disabled={!formData.subject}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select paper" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">Paper 1</SelectItem>
                <SelectItem value="2">Paper 2</SelectItem>
                <SelectItem value="3">Paper 3</SelectItem>
              </SelectContent>
            </Select>
            {(formData.exam_type === "KPSEA" || formData.exam_type === "KJSEA") && formData.subject && (
              <p className="text-xs text-muted-foreground">
                Topics shown are specific to this paper for {formData.exam_type} exams
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="time">Time Allowed (minutes)</Label>
            <Input
              id="time"
              type="number"
              min="30"
              max="180"
              value={formData.time_allowed_minutes}
              onChange={(e) => setFormData({ ...formData, time_allowed_minutes: parseInt(e.target.value) || 60 })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="questions">Number of Questions</Label>
            <Input
              id="questions"
              type="number"
              min="5"
              max="50"
              value={formData.question_count}
              onChange={(e) => setFormData({ ...formData, question_count: parseInt(e.target.value) || 10 })}
            />
          </div>
        </div>

        {availableStrands.length > 0 && (
          <div className="space-y-4">
            <div>
              <Label className="text-base">Topics Covered *</Label>
              <p className="text-sm text-muted-foreground mt-1">
                {(formData.exam_type === "KPSEA" || formData.exam_type === "KJSEA") && formData.paper_number
                  ? `Select topics for ${formData.exam_type} ${formData.subject} Paper ${formData.paper_number}. Topics are paper-specific.`
                  : "Select the topics you have taught. The exam will only include questions from these topics."
                }
              </p>
            </div>
            <div className="space-y-3 border rounded-lg p-4 max-h-96 overflow-y-auto">
              {availableStrands.map((strand) => {
                const topics = availableTopics[strand] || [];
                const isExpanded = expandedStrands.has(strand);
                const selectedTopics = formData.covered_topics[strand] || [];
                const allSelected = topics.length > 0 && selectedTopics.length === topics.length;
                const someSelected = selectedTopics.length > 0 && selectedTopics.length < topics.length;

                return (
                  <div key={strand} className="space-y-2">
                    <div className="flex items-start gap-2 p-2 hover:bg-accent/50 rounded-md">
                      <Checkbox
                        id={`strand-${strand}`}
                        checked={allSelected}
                        onCheckedChange={(checked) => handleStrandToggle(strand, checked as boolean)}
                        className={someSelected ? "data-[state=checked]:bg-primary/50" : ""}
                      />
                      <button
                        type="button"
                        onClick={() => toggleStrand(strand)}
                        className="flex items-center gap-2 flex-1 text-left"
                      >
                        {isExpanded ? (
                          <ChevronDown className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        )}
                        <Label htmlFor={`strand-${strand}`} className="font-medium cursor-pointer flex-1">
                          {strand}
                          {selectedTopics.length > 0 && (
                            <span className="ml-2 text-xs text-primary">
                              ({selectedTopics.length}/{topics.length} topics)
                            </span>
                          )}
                        </Label>
                      </button>
                    </div>
                    
                    {isExpanded && topics.length > 0 && (
                      <div className="ml-8 grid grid-cols-1 md:grid-cols-2 gap-2 pl-4 border-l-2 border-border">
                        {topics.map((topic) => (
                          <div key={topic} className="flex items-center space-x-2 p-1.5 hover:bg-accent/30 rounded">
                            <Checkbox
                              id={`topic-${strand}-${topic}`}
                              checked={selectedTopics.includes(topic)}
                              onCheckedChange={(checked) => handleTopicToggle(strand, topic, checked as boolean)}
                            />
                            <Label 
                              htmlFor={`topic-${strand}-${topic}`}
                              className="text-sm font-normal cursor-pointer flex-1"
                            >
                              {topic}
                            </Label>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            
            {Object.keys(formData.covered_topics).length > 0 && (
              <div className="text-sm text-muted-foreground bg-accent/50 p-3 rounded-md">
                <strong>Selected:</strong> {Object.values(formData.covered_topics).flat().length} topics across {Object.keys(formData.covered_topics).length} strands
              </div>
            )}
          </div>
        )}

        <div className="space-y-4">
          <Label>Difficulty Distribution</Label>
          <div className="space-y-3">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Easy</span>
                <span className="text-primary">{formData.difficulty.easy}%</span>
              </div>
              <Slider
                value={[formData.difficulty.easy]}
                onValueChange={([value]) => {
                  const remaining = 100 - value;
                  const mediumRatio = formData.difficulty.medium / (formData.difficulty.medium + formData.difficulty.hard);
                  setFormData({
                    ...formData,
                    difficulty: {
                      easy: value,
                      medium: Math.round(remaining * mediumRatio),
                      hard: remaining - Math.round(remaining * mediumRatio)
                    }
                  });
                }}
                min={0}
                max={100}
                step={5}
              />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Medium</span>
                <span className="text-primary">{formData.difficulty.medium}%</span>
              </div>
              <Slider
                value={[formData.difficulty.medium]}
                onValueChange={([value]) => {
                  const remaining = 100 - value;
                  const easyRatio = formData.difficulty.easy / (formData.difficulty.easy + formData.difficulty.hard);
                  setFormData({
                    ...formData,
                    difficulty: {
                      easy: Math.round(remaining * easyRatio),
                      medium: value,
                      hard: remaining - Math.round(remaining * easyRatio)
                    }
                  });
                }}
                min={0}
                max={100}
                step={5}
              />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Hard</span>
                <span className="text-primary">{formData.difficulty.hard}%</span>
              </div>
              <Slider
                value={[formData.difficulty.hard]}
                onValueChange={([value]) => {
                  const remaining = 100 - value;
                  const easyRatio = formData.difficulty.easy / (formData.difficulty.easy + formData.difficulty.medium);
                  setFormData({
                    ...formData,
                    difficulty: {
                      easy: Math.round(remaining * easyRatio),
                      medium: remaining - Math.round(remaining * easyRatio),
                      hard: value
                    }
                  });
                }}
                min={0}
                max={100}
                step={5}
              />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="omr">Include OMR Sheet</Label>
            <p className="text-sm text-muted-foreground">For KPSEA/KJSEA MCQs</p>
          </div>
          <Switch
            id="omr"
            checked={formData.include_omr}
            onCheckedChange={(checked) => setFormData({ ...formData, include_omr: checked })}
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="diagrams">Include Diagram Questions</Label>
            <p className="text-sm text-muted-foreground">Allow questions with diagrams</p>
          </div>
          <Switch
            id="diagrams"
            checked={formData.include_diagrams}
            onCheckedChange={(checked) => setFormData({ ...formData, include_diagrams: checked })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="instructions">Extra Instructions (Optional)</Label>
          <Textarea
            id="instructions"
            placeholder="e.g., No calculators allowed, Show all working..."
            value={formData.extra_instructions}
            onChange={(e) => setFormData({ ...formData, extra_instructions: e.target.value })}
            rows={3}
          />
        </div>

        <Button
          onClick={handleGenerate}
          disabled={isGenerating || !formData.class_level || !formData.subject || Object.keys(formData.covered_topics).length === 0}
          className="w-full"
          size="lg"
        >
          {isGenerating ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Generating Exam with AI...
            </>
          ) : (
            <>
              <Sparkles className="mr-2 h-5 w-5" />
              Generate Exam with Lovable AI
            </>
          )}
        </Button>
        
        {isGenerating && (
          <div className="mt-4 p-4 bg-accent/50 rounded-lg border border-border">
            <div className="flex items-center gap-3 mb-2">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
              <p className="text-sm font-medium">AI is generating your exam...</p>
            </div>
            <p className="text-xs text-muted-foreground ml-8">
              This may take 30-60 seconds. Creating questions from your selected topics.
            </p>
          </div>
        )}
        
        {Object.keys(formData.covered_topics).length === 0 && formData.subject && (
          <p className="text-sm text-muted-foreground text-center mt-2">
            Please select at least one topic you have covered
          </p>
        )}
        
        {!isGenerating && Object.keys(formData.covered_topics).length > 0 && (
          <div className="mt-3 p-3 bg-primary/10 rounded-lg border border-primary/20">
            <p className="text-sm text-center">
              <strong>{Object.values(formData.covered_topics).flat().length} topics</strong> selected across{" "}
              <strong>{Object.keys(formData.covered_topics).length} strands</strong>
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ExamGenerator;