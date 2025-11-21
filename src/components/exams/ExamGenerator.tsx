import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Loader2, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

const SUBJECTS = [
  "Mathematics", "English", "Kiswahili", "Science", 
  "Social Studies", "Religious Education", "Creative Arts"
];

const CLASS_LEVELS = [
  "PP1", "PP2", "Grade 1", "Grade 2", "Grade 3", "Grade 4",
  "Grade 5", "Grade 6", "Grade 7", "Grade 8", "Grade 9",
  "Form 1", "Form 2", "Form 3", "Form 4"
];

const EXAM_TYPES = [
  "KPSEA", "KJSEA", "End Term", "Mid Term", "Mock", "Opener", "CAT"
];

const STRANDS_BY_SUBJECT: Record<string, string[]> = {
  Mathematics: ["Numbers", "Algebra", "Geometry", "Measurement", "Data Handling", "Patterns"],
  English: ["Listening and Speaking", "Reading", "Writing", "Grammar", "Comprehension"],
  Kiswahili: ["Kusoma", "Kuandika", "Kusikiliza", "Kusema", "Sarufi"],
  Science: ["Living Things", "Materials", "Energy", "Forces", "Earth and Space"],
  "Social Studies": ["Geography", "History", "Citizenship", "Economics"],
};

const ExamGenerator = () => {
  const { toast } = useToast();
  const { institution } = useAuth();
  
  const [formData, setFormData] = useState({
    school_name: institution?.name || "",
    class_level: "",
    exam_type: "",
    subject: "",
    paper_number: 1,
    time_allowed_minutes: 60,
    question_count: 10,
    strands: [] as string[],
    include_omr: false,
    include_diagrams: false,
    extra_instructions: "",
    difficulty: { easy: 40, medium: 40, hard: 20 }
  });

  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedExamId, setGeneratedExamId] = useState<string | null>(null);

  const availableStrands = STRANDS_BY_SUBJECT[formData.subject] || [];

  const handleGenerate = async () => {
    if (!formData.class_level || !formData.exam_type || !formData.subject || formData.strands.length === 0) {
      toast({
        title: "Missing Fields",
        description: "Please fill in class level, exam type, subject, and select at least one strand",
        variant: "destructive"
      });
      return;
    }

    setIsGenerating(true);
    
    try {
      const { data: userData } = await supabase.auth.getUser();
      
      const payload = {
        ...formData,
        owner_id: userData.user?.id,
        institution_id: institution?.id
      };

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-exam`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`
          },
          body: JSON.stringify(payload)
        }
      );

      if (response.status === 402) {
        toast({
          title: "Payment Required",
          description: "Please add credits to your Lovable AI workspace to use this feature",
          variant: "destructive"
        });
        return;
      }

      if (response.status === 429) {
        toast({
          title: "Rate Limited",
          description: "Too many requests. Please wait a moment and try again",
          variant: "destructive"
        });
        return;
      }

      if (!response.ok) {
        throw new Error('Failed to generate exam');
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

      // Refresh to show in history
      window.location.reload();

    } catch (error) {
      console.error('Error generating exam:', error);
      toast({
        title: "Generation Failed",
        description: error instanceof Error ? error.message : "Failed to generate exam",
        variant: "destructive"
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
          Generate KNEC/CBC Exam
        </CardTitle>
        <CardDescription>
          Configure your exam parameters and generate AI-powered KNEC-compliant exams
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
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
            <Select value={formData.class_level} onValueChange={(value) => setFormData({ ...formData, class_level: value })}>
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
            <Label htmlFor="subject">Subject *</Label>
            <Select value={formData.subject} onValueChange={(value) => setFormData({ ...formData, subject: value, strands: [] })}>
              <SelectTrigger>
                <SelectValue placeholder="Select subject" />
              </SelectTrigger>
              <SelectContent>
                {SUBJECTS.map((subject) => (
                  <SelectItem key={subject} value={subject}>{subject}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="paper_number">Paper Number</Label>
            <Input
              id="paper_number"
              type="number"
              min="1"
              max="3"
              value={formData.paper_number}
              onChange={(e) => setFormData({ ...formData, paper_number: parseInt(e.target.value) || 1 })}
            />
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
          <div className="space-y-3">
            <Label>Strands to Include *</Label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {availableStrands.map((strand) => (
                <div key={strand} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id={strand}
                    checked={formData.strands.includes(strand)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setFormData({ ...formData, strands: [...formData.strands, strand] });
                      } else {
                        setFormData({ ...formData, strands: formData.strands.filter(s => s !== strand) });
                      }
                    }}
                    className="h-4 w-4 rounded border-input"
                  />
                  <Label htmlFor={strand} className="text-sm font-normal cursor-pointer">
                    {strand}
                  </Label>
                </div>
              ))}
            </div>
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
          disabled={isGenerating || !formData.class_level || !formData.subject || formData.strands.length === 0}
          className="w-full"
          size="lg"
        >
          {isGenerating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating Exam...
            </>
          ) : (
            <>
              <Sparkles className="mr-2 h-4 w-4" />
              Generate Exam
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
};

export default ExamGenerator;