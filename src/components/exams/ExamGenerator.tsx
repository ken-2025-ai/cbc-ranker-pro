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

// Detailed topics by strand for each subject
const TOPICS_BY_STRAND: Record<string, Record<string, string[]>> = {
  Mathematics: {
    "Numbers": ["Counting", "Addition", "Subtraction", "Multiplication", "Division", "Fractions", "Decimals", "Percentages", "Place Value", "Number Patterns"],
    "Algebra": ["Variables", "Expressions", "Equations", "Inequalities", "Functions", "Linear Equations"],
    "Geometry": ["Shapes", "Angles", "Lines", "Symmetry", "Transformations", "3D Shapes", "Constructions"],
    "Measurement": ["Length", "Mass", "Capacity", "Time", "Money", "Temperature", "Area", "Perimeter", "Volume"],
    "Data Handling": ["Data Collection", "Tables", "Graphs", "Charts", "Mean", "Median", "Mode", "Probability"],
    "Patterns": ["Number Patterns", "Shape Patterns", "Sequences"]
  },
  "Mathematical Activities": {
    "Numbers": ["Counting 1-10", "Counting 1-20", "Number Recognition", "More/Less", "Before/After"],
    "Patterns": ["Color Patterns", "Shape Patterns", "Sound Patterns", "Movement Patterns"],
    "Shapes": ["Circle", "Square", "Triangle", "Rectangle", "Oval"],
    "Measurement": ["Big/Small", "Long/Short", "Heavy/Light", "Full/Empty"]
  },
  English: {
    "Listening and Speaking": ["Oral Communication", "Conversations", "Storytelling", "Pronunciation", "Vocabulary"],
    "Reading": ["Phonics", "Word Recognition", "Comprehension", "Reading Fluency", "Story Reading"],
    "Writing": ["Letter Formation", "Sentence Writing", "Paragraph Writing", "Composition", "Creative Writing"],
    "Grammar": ["Nouns", "Verbs", "Adjectives", "Pronouns", "Tenses", "Punctuation", "Sentence Structure"],
    "Comprehension": ["Main Ideas", "Details", "Inference", "Summary", "Critical Reading"]
  },
  "Literacy Activities": {
    "Listening": ["Listen to Stories", "Follow Instructions", "Sound Recognition"],
    "Speaking": ["Name Objects", "Simple Sentences", "Describe Pictures", "Tell Stories"],
    "Pre-reading": ["Letter Recognition", "Letter Sounds", "Picture Reading"],
    "Pre-writing": ["Tracing", "Coloring", "Drawing Lines", "Holding Pencil"]
  },
  Kiswahili: {
    "Kusoma": ["Sauti za Herufi", "Maneno", "Sentensi", "Hadithi", "Mashairi"],
    "Kuandika": ["Herufi", "Maneno", "Sentensi", "Insha", "Barua"],
    "Kusikiliza": ["Mazungumzo", "Maagizo", "Hadithi"],
    "Kusema": ["Mazungumzo", "Hadithi", "Maelezo"],
    "Sarufi": ["Nomino", "Vitenzi", "Vivumishi", "Wakati", "Alama za Uandishi"]
  },
  Science: {
    "Living Things": ["Plants", "Animals", "Human Body", "Life Processes", "Classification", "Habitats", "Food Chains"],
    "Materials": ["Properties", "States of Matter", "Changes", "Mixtures", "Separation"],
    "Energy": ["Light", "Heat", "Sound", "Electricity", "Magnetism", "Energy Sources"],
    "Forces": ["Push and Pull", "Friction", "Gravity", "Motion", "Simple Machines"],
    "Earth and Space": ["Weather", "Seasons", "Day and Night", "Solar System", "Earth Features"]
  },
  "Environmental Activities": {
    "Living Things": ["Plants Around Us", "Animals Around Us", "Caring for Plants", "Caring for Animals"],
    "Weather": ["Sunny Days", "Rainy Days", "Windy Days", "Cloudy Days"],
    "Safety": ["Road Safety", "Water Safety", "Fire Safety", "Stranger Danger"],
    "Community": ["My Home", "My School", "My Neighborhood", "Helpers in Community"]
  },
  "Social Studies": {
    "Geography": ["Maps", "Directions", "Continents", "Countries", "Physical Features", "Climate", "Resources"],
    "History": ["Timeline", "Early People", "Historical Events", "National Heroes", "Traditions"],
    "Citizenship": ["Rights", "Responsibilities", "Government", "National Symbols", "Values"],
    "Economics": ["Needs and Wants", "Trade", "Money", "Production", "Business"]
  },
  "Integrated Science": {
    "Living Things": ["Plants", "Animals", "Human Body", "Life Processes", "Classification", "Habitats"],
    "Materials": ["Properties", "States of Matter", "Changes", "Mixtures"],
    "Energy": ["Light", "Heat", "Sound", "Electricity", "Magnetism"],
    "Forces": ["Push and Pull", "Friction", "Motion"],
    "Earth and Space": ["Weather", "Seasons", "Solar System"]
  },
  "Pre-Technical Studies": {
    "Technology": ["Tools", "Materials", "Processes", "Design"],
    "Safety": ["Workshop Safety", "Tool Handling", "First Aid"],
    "Projects": ["Planning", "Construction", "Testing", "Evaluation"]
  },
  Agriculture: {
    "Crop Production": ["Land Preparation", "Planting", "Weeding", "Harvesting", "Storage"],
    "Animal Husbandry": ["Types of Animals", "Feeding", "Housing", "Animal Health", "Products"],
    "Tools and Equipment": ["Farm Tools", "Tool Maintenance", "Safety"],
    "Soil and Water": ["Soil Types", "Soil Conservation", "Water Sources", "Irrigation"]
  },
  "Home Science": {
    "Food and Nutrition": ["Food Groups", "Balanced Diet", "Food Preparation", "Food Storage", "Kitchen Safety"],
    "Clothing": ["Types of Clothing", "Clothing Care", "Basic Sewing", "Fabric Types"],
    "Home Management": ["Cleaning", "Organization", "Safety at Home", "Family Care"]
  },
  "Creative Arts": {
    "Visual Arts": ["Drawing", "Painting", "Collage", "Sculpture", "Craft"],
    "Music": ["Singing", "Rhythm", "Musical Instruments", "Composition", "Performance"],
    "Drama": ["Acting", "Role Play", "Storytelling", "Movement", "Performance"]
  },
  "Physical Education": {
    "Athletics": ["Running", "Jumping", "Throwing", "Relay"],
    "Ball Games": ["Football", "Netball", "Volleyball", "Basketball", "Handball"],
    "Gymnastics": ["Balance", "Flexibility", "Coordination", "Tumbling"],
    "Health": ["Physical Fitness", "Warm-up", "Cool-down", "Safety", "First Aid"]
  },
  CRE: {
    "Old Testament": ["Creation", "Abraham", "Moses", "Kings", "Prophets"],
    "New Testament": ["Birth of Jesus", "Ministry of Jesus", "Miracles", "Teachings", "Death and Resurrection"],
    "Christian Living": ["Prayer", "Worship", "Values", "Morals", "Community Service"]
  },
  IRE: {
    "Quran": ["Surahs", "Recitation", "Meaning", "Application"],
    "Hadith": ["Prophetic Traditions", "Interpretation", "Application"],
    "Islamic Practices": ["Prayer", "Fasting", "Charity", "Pilgrimage"],
    "Islamic Living": ["Values", "Morals", "Family", "Community"]
  },
  HRE: {
    "Hindu Scriptures": ["Vedas", "Upanishads", "Bhagavad Gita"],
    "Hindu Practices": ["Worship", "Festivals", "Rituals", "Meditation"],
    "Hindu Living": ["Values", "Dharma", "Karma", "Family", "Community"]
  },
  ICT: {
    "Computer Basics": ["Parts of Computer", "Input/Output Devices", "Storage", "Operating System"],
    "Internet": ["Web Browsing", "Email", "Online Safety", "Search Engines"],
    "Applications": ["Word Processing", "Spreadsheets", "Presentations", "Graphics"],
    "Programming": ["Coding Basics", "Algorithms", "Debugging", "Problem Solving"]
  },
  Business: {
    "Introduction to Business": ["Types of Business", "Business Environment", "Entrepreneurship"],
    "Trade": ["Buying and Selling", "Markets", "Pricing", "Marketing"],
    "Finance": ["Money Management", "Banking", "Saving", "Budgeting"],
    "Records": ["Record Keeping", "Receipts", "Invoices", "Financial Statements"]
  },
  "Business Studies": {
    "Introduction to Business": ["Types of Business", "Business Environment", "Entrepreneurship", "Business Opportunities"],
    "Trade": ["Buying and Selling", "Markets", "Pricing", "Marketing", "E-commerce"],
    "Finance": ["Money Management", "Banking", "Saving", "Budgeting", "Investment"],
    "Records": ["Record Keeping", "Receipts", "Invoices", "Financial Statements", "Accounting Basics"]
  },
  "Arabic": {
    "Reading": ["Arabic Alphabet", "Vowels", "Word Recognition", "Sentence Reading", "Comprehension"],
    "Writing": ["Letter Formation", "Word Writing", "Sentence Writing", "Composition"],
    "Grammar": ["Nouns", "Verbs", "Adjectives", "Sentence Structure", "Tenses"],
    "Conversation": ["Greetings", "Introductions", "Daily Conversations", "Vocabulary"]
  },
  "Arabic (JS)": {
    "Reading and Comprehension": ["Advanced Reading", "Text Analysis", "Literary Texts", "Comprehension Skills"],
    "Writing Skills": ["Essay Writing", "Creative Writing", "Formal Writing", "Letter Writing"],
    "Grammar": ["Advanced Grammar", "Syntax", "Morphology", "Rhetoric"],
    "Conversation": ["Formal Communication", "Presentations", "Debates", "Cultural Topics"]
  },
  "Christian Religious Education": {
    "Old Testament": ["Creation", "Abraham", "Moses", "Kings", "Prophets"],
    "New Testament": ["Birth of Jesus", "Ministry of Jesus", "Miracles", "Teachings", "Death and Resurrection"],
    "Christian Living": ["Prayer", "Worship", "Values", "Morals", "Community Service"]
  },
  "Computer Science": {
    "Computer Basics": ["Parts of Computer", "Input/Output Devices", "Storage", "Operating System"],
    "Internet": ["Web Browsing", "Email", "Online Safety", "Search Engines"],
    "Applications": ["Word Processing", "Spreadsheets", "Presentations", "Graphics"],
    "Programming": ["Coding Basics", "Algorithms", "Debugging", "Problem Solving"]
  },
  "Computer Science (JS)": {
    "Computer Systems": ["Hardware Components", "Software Types", "Operating Systems", "Computer Networks"],
    "Internet and Web": ["Web Technologies", "Online Safety", "Digital Citizenship", "Cloud Computing"],
    "Applications": ["Advanced Word Processing", "Spreadsheets and Formulas", "Database Basics", "Multimedia"],
    "Programming": ["Programming Concepts", "Algorithms", "Data Structures", "Problem Solving", "Scratch/Python"]
  },
  "English (JS)": {
    "Listening and Speaking": ["Oral Communication", "Presentations", "Discussions", "Public Speaking", "Pronunciation"],
    "Reading": ["Reading Strategies", "Literary Texts", "Non-fiction", "Critical Reading", "Vocabulary"],
    "Writing": ["Essay Writing", "Creative Writing", "Report Writing", "Business Writing", "Research"],
    "Grammar": ["Parts of Speech", "Tenses", "Sentence Structure", "Punctuation", "Language Use"],
    "Literature": ["Poetry", "Prose", "Drama", "Literary Devices", "Text Analysis"]
  },
  "Agriculture (JS)": {
    "Crop Production": ["Land Preparation", "Planting Techniques", "Crop Management", "Harvesting", "Storage", "Value Addition"],
    "Animal Husbandry": ["Types of Livestock", "Feeding Systems", "Housing", "Animal Health", "Products", "Marketing"],
    "Farm Management": ["Farm Planning", "Record Keeping", "Budgeting", "Marketing", "Agribusiness"],
    "Soil and Water": ["Soil Types", "Soil Conservation", "Fertilizers", "Irrigation Systems", "Water Management"]
  },
  "French (JS)": {
    "Reading and Comprehension": ["Text Reading", "Comprehension", "Vocabulary", "Literary Texts"],
    "Writing": ["Sentence Writing", "Composition", "Letter Writing", "Essay Writing"],
    "Grammar": ["Nouns", "Verbs", "Adjectives", "Tenses", "Sentence Structure"],
    "Conversation": ["Greetings", "Introductions", "Daily Life", "Cultural Topics"]
  },
  "German (JS)": {
    "Reading and Comprehension": ["Text Reading", "Comprehension", "Vocabulary", "Literary Texts"],
    "Writing": ["Sentence Writing", "Composition", "Letter Writing", "Essay Writing"],
    "Grammar": ["Nouns", "Verbs", "Adjectives", "Cases", "Sentence Structure"],
    "Conversation": ["Greetings", "Introductions", "Daily Life", "Cultural Topics"]
  },
  "Home Science (JS)": {
    "Food and Nutrition": ["Nutrition Principles", "Meal Planning", "Food Preparation", "Food Preservation", "Kitchen Management"],
    "Clothing and Textiles": ["Fabrics", "Clothing Construction", "Clothing Care", "Fashion Design", "Sewing Techniques"],
    "Home Management": ["Home Planning", "Resource Management", "Interior Design", "Family Dynamics", "Consumer Education"]
  },
  "Kiswahili (JS)": {
    "Kusoma na Kuelewa": ["Kusoma kwa Sauti", "Uelewa wa Maandishi", "Uchambuzi wa Maandishi", "Fasihi"],
    "Kuandika": ["Insha", "Barua", "Ripoti", "Uandishi wa Kibiashara"],
    "Sarufi": ["Vitenzi", "Nomino", "Vivumishi", "Sentensi", "Matumizi ya Lugha"],
    "Mazungumzo": ["Mawasiliano", "Hotuba", "Majadiliano", "Utamaduni"]
  },
  "Life Skills Education (JS)": {
    "Personal Development": ["Self Awareness", "Self Esteem", "Goal Setting", "Decision Making"],
    "Health and Wellness": ["Nutrition", "Physical Fitness", "Mental Health", "Substance Abuse Prevention"],
    "Relationships": ["Communication", "Conflict Resolution", "Peer Pressure", "Family Relationships"],
    "Safety and Security": ["Personal Safety", "Digital Safety", "Emergency Preparedness", "First Aid"]
  },
  "Mandarin (JS)": {
    "Reading and Comprehension": ["Character Reading", "Text Comprehension", "Vocabulary", "Pinyin"],
    "Writing": ["Character Writing", "Sentence Writing", "Composition", "Stroke Order"],
    "Grammar": ["Sentence Structure", "Grammar Patterns", "Tenses", "Particles"],
    "Conversation": ["Greetings", "Daily Conversations", "Cultural Topics", "Pronunciation"]
  },
  "Mathematics (JS)": {
    "Numbers": ["Integers", "Rational Numbers", "Real Numbers", "Number Operations", "HCF and LCM", "Exponents"],
    "Algebra": ["Algebraic Expressions", "Linear Equations", "Inequalities", "Simultaneous Equations", "Quadratic Equations"],
    "Geometry": ["Angles", "Triangles", "Quadrilaterals", "Circles", "Constructions", "Transformations", "Pythagoras Theorem"],
    "Measurement": ["Length", "Area", "Volume", "Time", "Speed", "Density"],
    "Statistics": ["Data Collection", "Frequency Tables", "Graphs", "Mean, Median, Mode", "Probability"],
    "Commercial Arithmetic": ["Profit and Loss", "Simple Interest", "Compound Interest", "Discount", "Commission"]
  },
  "Performing Arts (JS)": {
    "Music": ["Music Theory", "Vocal Techniques", "Instrumental Skills", "Music Composition", "Music History"],
    "Dance": ["Dance Techniques", "Choreography", "Dance Styles", "Performance", "Dance History"],
    "Drama": ["Acting Techniques", "Script Writing", "Stage Management", "Performance", "Drama History"]
  },
  "Physical and Health Education (JS)": {
    "Athletics": ["Track Events", "Field Events", "Combined Events", "Training Principles"],
    "Ball Games": ["Football", "Basketball", "Volleyball", "Handball", "Rugby", "Game Rules"],
    "Gymnastics": ["Floor Exercises", "Apparatus Work", "Balance", "Flexibility"],
    "Health Education": ["Nutrition", "First Aid", "Disease Prevention", "Mental Health", "Substance Abuse"]
  },
  "Religious Education CRE (JS)": {
    "Old Testament": ["Patriarchs", "Exodus", "Prophets", "Kings", "Covenant"],
    "New Testament": ["Life of Jesus", "Early Church", "Paul's Letters", "Teachings", "Miracles"],
    "Christian Living": ["Christian Ethics", "Prayer Life", "Church", "Sacraments", "Social Issues"]
  },
  "Religious Education IRE (JS)": {
    "Quran": ["Selected Surahs", "Tafsir", "Tajweed", "Themes", "Application"],
    "Hadith": ["Selected Hadiths", "Interpretation", "Classification", "Application"],
    "Islamic Practices": ["Ibadah", "Fiqh", "Islamic Calendar", "Pillars of Islam"],
    "Islamic Living": ["Akhlaq", "Social Relations", "Family", "Contemporary Issues"]
  },
  "Religious Education HRE (JS)": {
    "Hindu Scriptures": ["Vedas", "Upanishads", "Bhagavad Gita", "Puranas"],
    "Hindu Practices": ["Worship", "Festivals", "Samskaras", "Yoga", "Meditation"],
    "Hindu Philosophy": ["Dharma", "Karma", "Moksha", "Reincarnation"],
    "Hindu Living": ["Values", "Ethics", "Family Life", "Social Duties"]
  },
  "Visual Arts (JS)": {
    "Drawing": ["Drawing Techniques", "Perspective", "Shading", "Composition", "Still Life"],
    "Painting": ["Color Theory", "Painting Techniques", "Mixed Media", "Artistic Styles"],
    "Sculpture": ["Modeling", "Carving", "Casting", "3D Design"],
    "Design": ["Graphic Design", "Layout", "Typography", "Digital Art", "Portfolio Development"]
  },
  "Hygiene and Nutrition Activities": {
    "Personal Hygiene": ["Hand Washing", "Teeth Brushing", "Bathing", "Clean Clothes"],
    "Nutrition": ["Healthy Foods", "Food Groups", "Balanced Diet", "Eating Habits"],
    "Health Habits": ["Exercise", "Sleep", "Cleanliness", "Safety"]
  },
  "Religious Education Activities": {
    "Values": ["Kindness", "Honesty", "Respect", "Sharing", "Love"],
    "Stories": ["Bible Stories", "Moral Stories", "Faith Stories"],
    "Prayer": ["Types of Prayer", "When to Pray", "Prayer Songs"]
  },
  "Movement and Creative Activities": {
    "Physical Play": ["Running", "Jumping", "Dancing", "Ball Games", "Balance"],
    "Art": ["Drawing", "Coloring", "Cutting", "Pasting", "Painting"],
    "Music": ["Singing", "Rhythm", "Musical Instruments", "Songs"],
    "Drama": ["Role Play", "Acting", "Storytelling", "Puppets"]
  }
};

const STRANDS_BY_SUBJECT: Record<string, string[]> = Object.keys(TOPICS_BY_STRAND).reduce((acc, subject) => {
  acc[subject] = Object.keys(TOPICS_BY_STRAND[subject]);
  return acc;
}, {} as Record<string, string[]>);

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

  const availableStrands = STRANDS_BY_SUBJECT[formData.subject] || [];
  const availableTopics = TOPICS_BY_STRAND[formData.subject] || {};

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
              onValueChange={(value) => setFormData({ ...formData, subject: value, strands: [] })}
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
          <div className="space-y-4">
            <div>
              <Label className="text-base">Topics Covered *</Label>
              <p className="text-sm text-muted-foreground mt-1">
                Select the topics you have taught. The exam will only include questions from these topics.
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