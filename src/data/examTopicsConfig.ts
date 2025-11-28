// Class-specific and paper-specific topic configuration for CBC/KNEC exams

export interface TopicConfig {
  [subject: string]: {
    [classLevel: string]: {
      strands: {
        [strand: string]: {
          topics: string[];
          papers?: number[]; // Which papers include this strand (for KPSEA/KJSEA)
        };
      };
      paperMapping?: {
        [paperNumber: number]: string[]; // Strands included in each paper
      };
    };
  };
}

// Exam paper configurations per subject and class
export interface ExamPaperConfig {
  papers: number;
  paperDetails: {
    [paperNumber: number]: {
      duration: number; // in minutes
      totalMarks: number;
      sections?: string[];
    };
  };
}

export const EXAM_PAPER_CONFIGS: { [subject: string]: { [classLevel: string]: ExamPaperConfig } } = {
  "Mathematics": {
    "Grade 6": { papers: 2, paperDetails: { 1: { duration: 90, totalMarks: 50 }, 2: { duration: 90, totalMarks: 50 } } },
    "Grade 9": { papers: 1, paperDetails: { 1: { duration: 120, totalMarks: 100, sections: ["Multiple Choice (20 marks)", "Structured (80 marks)"] } } }
  },
  "English": {
    "Grade 6": { papers: 3, paperDetails: { 1: { duration: 90, totalMarks: 40 }, 2: { duration: 90, totalMarks: 40 }, 3: { duration: 90, totalMarks: 20 } } },
    "Grade 9": { papers: 2, paperDetails: { 1: { duration: 100, totalMarks: 50 }, 2: { duration: 110, totalMarks: 50 } } }
  },
  "Kiswahili": {
    "Grade 6": { papers: 2, paperDetails: { 1: { duration: 90, totalMarks: 50 }, 2: { duration: 90, totalMarks: 50 } } },
    "Grade 9": { papers: 2, paperDetails: { 1: { duration: 100, totalMarks: 50 }, 2: { duration: 105, totalMarks: 50 } } }
  },
  "Integrated Science": {
    "Grade 6": { papers: 2, paperDetails: { 1: { duration: 90, totalMarks: 70 }, 2: { duration: 120, totalMarks: 30 } } },
    "Grade 9": { papers: 2, paperDetails: { 1: { duration: 100, totalMarks: 70 }, 2: { duration: 120, totalMarks: 30 } } }
  },
  "Social Studies": {
    "Grade 6": { papers: 1, paperDetails: { 1: { duration: 90, totalMarks: 100 } } },
    "Grade 9": { papers: 1, paperDetails: { 1: { duration: 90, totalMarks: 100 } } }
  },
  "CRE": {
    "Grade 9": { papers: 1, paperDetails: { 1: { duration: 90, totalMarks: 100 } } }
  },
  "IRE": {
    "Grade 9": { papers: 1, paperDetails: { 1: { duration: 90, totalMarks: 100 } } }
  },
  "HRE": {
    "Grade 9": { papers: 1, paperDetails: { 1: { duration: 90, totalMarks: 100 } } }
  },
  "Agriculture and Nutrition": {
    "Grade 9": { papers: 1, paperDetails: { 1: { duration: 100, totalMarks: 70 } } }
  },
  "Creative Arts and Sports": {
    "Grade 9": { papers: 2, paperDetails: { 1: { duration: 0, totalMarks: 0 }, 2: { duration: 100, totalMarks: 100 } } }
  },
  "Pre-Technical Studies": {
    "Grade 9": { papers: 2, paperDetails: { 1: { duration: 100, totalMarks: 80 }, 2: { duration: 0, totalMarks: 40 } } }
  }
};

export const EXAM_TOPICS_CONFIG: TopicConfig = {
  Mathematics: {
    "Grade 1": {
      strands: {
        "Numbers": {
          topics: ["Counting 0-20", "Number Recognition", "More/Less", "Before/After", "Ordering Numbers"],
          papers: [1, 2]
        },
        "Addition and Subtraction": {
          topics: ["Adding within 10", "Subtracting within 10", "Word Problems"],
          papers: [1]
        },
        "Measurement": {
          topics: ["Length - Long/Short", "Mass - Heavy/Light", "Capacity - Full/Empty", "Time - Days"],
          papers: [2]
        },
        "Shapes": {
          topics: ["Circle", "Square", "Triangle", "Rectangle"],
          papers: [2]
        }
      }
    },
    "Grade 2": {
      strands: {
        "Numbers": {
          topics: ["Counting 0-99", "Place Value", "Odd/Even", "Skip Counting", "Number Patterns"],
          papers: [1, 2]
        },
        "Addition and Subtraction": {
          topics: ["Addition within 99", "Subtraction within 99", "Word Problems", "Missing Numbers"],
          papers: [1]
        },
        "Multiplication": {
          topics: ["Repeated Addition", "Multiplication by 2, 5, 10", "Arrays"],
          papers: [1]
        },
        "Measurement": {
          topics: ["Length - Meters", "Mass - Kilograms", "Capacity - Liters", "Time - Hours and Minutes", "Money - Coins"],
          papers: [2]
        },
        "Geometry": {
          topics: ["2D Shapes", "3D Shapes", "Lines and Curves", "Patterns"],
          papers: [2]
        }
      }
    },
    "Grade 3": {
      strands: {
        "Numbers": {
          topics: ["Counting to 1000", "Place Value (Hundreds)", "Comparing Numbers", "Number Patterns", "Roman Numerals"],
          papers: [1, 2]
        },
        "Operations": {
          topics: ["Addition within 1000", "Subtraction within 1000", "Multiplication Tables 2-10", "Division Facts", "Word Problems"],
          papers: [1]
        },
        "Fractions": {
          topics: ["Halves", "Quarters", "Thirds", "Comparing Fractions"],
          papers: [1]
        },
        "Measurement": {
          topics: ["Length - km, m, cm", "Mass - kg, g", "Capacity - L, mL", "Time - Calendar", "Money - Notes and Coins"],
          papers: [2]
        },
        "Geometry": {
          topics: ["Shapes and Properties", "Lines of Symmetry", "Angles - Right Angle", "Perimeter"],
          papers: [2]
        }
      }
    },
    "Grade 4": {
      strands: {
        "Numbers": {
          topics: ["Numbers to 100,000", "Place Value", "Rounding", "Number Sequences", "Factors and Multiples"],
          papers: [1]
        },
        "Operations": {
          topics: ["Multi-digit Addition", "Multi-digit Subtraction", "Multiplication by 2-digit", "Division with Remainders", "Order of Operations"],
          papers: [1]
        },
        "Fractions and Decimals": {
          topics: ["Equivalent Fractions", "Adding Fractions", "Decimals to 1 d.p.", "Converting Fractions to Decimals"],
          papers: [1, 2]
        },
        "Measurement": {
          topics: ["Perimeter", "Area of Rectangles", "Volume", "Time - 24-hour Clock", "Money - Budget"],
          papers: [2]
        },
        "Geometry": {
          topics: ["Types of Angles", "Triangles", "Quadrilaterals", "Symmetry", "Coordinates"],
          papers: [2]
        },
        "Data Handling": {
          topics: ["Bar Graphs", "Pictographs", "Tables", "Mode"],
          papers: [2]
        }
      }
    },
    "Grade 5": {
      strands: {
        "Numbers": {
          topics: ["Numbers to Millions", "Prime Numbers", "Square Numbers", "LCM and HCF", "Number Patterns"],
          papers: [1]
        },
        "Operations": {
          topics: ["Long Multiplication", "Long Division", "Mixed Operations", "Word Problems", "Estimation"],
          papers: [1]
        },
        "Fractions and Decimals": {
          topics: ["Operations with Fractions", "Mixed Numbers", "Decimals to 2 d.p.", "Percentages", "Ratio"],
          papers: [1, 2]
        },
        "Measurement": {
          topics: ["Area - Triangles and Compound Shapes", "Volume of Cubes", "Perimeter", "Time Calculations", "Money Problems"],
          papers: [2]
        },
        "Geometry": {
          topics: ["Angle Measurement", "Perpendicular Lines", "Parallel Lines", "Circles", "3D Shapes"],
          papers: [2]
        },
        "Data Handling": {
          topics: ["Line Graphs", "Pie Charts", "Mean", "Median", "Probability - Simple"],
          papers: [2]
        }
      }
    },
    "Grade 6": {
      strands: {
        "Numbers": {
          topics: ["Whole Numbers to Billions", "Powers and Roots", "Standard Form", "Sequences", "Number Puzzles"],
          papers: [1]
        },
        "Operations": {
          topics: ["All Operations", "BODMAS", "Estimation and Approximation", "Word Problems"],
          papers: [1]
        },
        "Fractions, Decimals, and Percentages": {
          topics: ["All Fraction Operations", "Decimal Operations", "Percentage Calculations", "Ratio and Proportion", "Conversions"],
          papers: [1]
        },
        "Measurement": {
          topics: ["Area - All Shapes", "Volume - Cuboids", "Surface Area", "Speed, Distance, Time", "Money - Interest"],
          papers: [2]
        },
        "Geometry": {
          topics: ["Construction", "Angle Properties", "Transformations", "Scale Drawing", "Coordinates - All Quadrants"],
          papers: [2]
        },
        "Data Handling": {
          topics: ["All Graph Types", "Statistics", "Probability", "Interpreting Data"],
          papers: [2]
        }
      },
      paperMapping: {
        1: ["Numbers", "Operations", "Fractions, Decimals, and Percentages"],
        2: ["Measurement", "Geometry", "Data Handling", "Fractions, Decimals, and Percentages"]
      }
    },
    "Grade 7": {
      strands: {
        "Numbers": {
          topics: ["Integers", "Directed Numbers", "Powers and Roots", "Scientific Notation", "Surds - Introduction"],
          papers: [1]
        },
        "Algebra": {
          topics: ["Introduction to Algebra", "Algebraic Expressions", "Simplifying Expressions", "Linear Equations", "Inequalities"],
          papers: [1]
        },
        "Ratio and Proportion": {
          topics: ["Ratios", "Direct Proportion", "Inverse Proportion", "Percentages", "Rate"],
          papers: [1, 2]
        },
        "Measurement": {
          topics: ["Area of Polygons", "Circumference and Area of Circles", "Surface Area", "Volume", "Speed and Density"],
          papers: [2]
        },
        "Geometry": {
          topics: ["Angle Properties", "Triangles", "Quadrilaterals", "Circle Properties", "Constructions", "Loci"],
          papers: [2]
        },
        "Data and Probability": {
          topics: ["Frequency Tables", "Bar Charts", "Pie Charts", "Mean, Median, Mode", "Range", "Probability"],
          papers: [2]
        }
      }
    },
    "Grade 8": {
      strands: {
        "Numbers": {
          topics: ["Number Systems", "Rational Numbers", "Irrational Numbers", "Real Numbers", "Powers and Roots"],
          papers: [1]
        },
        "Algebra": {
          topics: ["Expanding Brackets", "Factorization", "Linear Equations", "Simultaneous Equations", "Changing Subject of Formula"],
          papers: [1]
        },
        "Commercial Arithmetic": {
          topics: ["Profit and Loss", "Discount", "Commission", "Simple Interest", "Compound Interest", "Hire Purchase"],
          papers: [1, 2]
        },
        "Measurement": {
          topics: ["Area - Composite Shapes", "Volume - Prisms and Cylinders", "Surface Area", "Capacity"],
          papers: [2]
        },
        "Geometry": {
          topics: ["Similarity", "Congruence", "Pythagoras Theorem", "Trigonometry - Introduction", "Bearings"],
          papers: [2]
        },
        "Statistics and Probability": {
          topics: ["Grouped Data", "Histograms", "Cumulative Frequency", "Probability - Compound Events"],
          papers: [2]
        }
      }
    },
    "Grade 9": {
      strands: {
        "Numbers and Operations": {
          topics: ["Sets", "Number Bases", "Binary Operations", "Matrices - Introduction", "Sequences and Series"],
          papers: [1]
        },
        "Algebra": {
          topics: ["Quadratic Expressions", "Quadratic Equations", "Completing the Square", "Inequalities", "Functions"],
          papers: [1]
        },
        "Financial Mathematics": {
          topics: ["Taxation", "Insurance", "Banking", "Investments", "Budgeting", "Foreign Exchange"],
          papers: [1]
        },
        "Measurement and Mensuration": {
          topics: ["Arc Length", "Sector Area", "Volume - Pyramids and Cones", "Surface Area - Complex Shapes", "Latitude and Longitude"],
          papers: [1]
        },
        "Geometry and Trigonometry": {
          topics: ["Circle Theorems", "Trigonometric Ratios", "Angles of Elevation and Depression", "3D Geometry", "Vectors - Introduction"],
          papers: [1]
        },
        "Statistics and Probability": {
          topics: ["Measures of Dispersion", "Probability Distributions", "Sampling", "Statistical Inference - Introduction"],
          papers: [1]
        }
      }
    }
  },
  English: {
    "Grade 1": {
      strands: {
        "Listening and Speaking": {
          topics: ["Oral Communication", "Listen to Stories", "Recite Rhymes", "Name Objects"],
          papers: [1]
        },
        "Reading": {
          topics: ["Letter Sounds", "Word Recognition", "Simple Sentences", "Picture Reading"],
          papers: [1, 2]
        },
        "Writing": {
          topics: ["Letter Formation", "Tracing", "Copying Words", "Name Writing"],
          papers: [2]
        }
      }
    },
    "Grade 2": {
      strands: {
        "Listening and Speaking": {
          topics: ["Conversations", "Following Instructions", "Storytelling", "Describing Pictures"],
          papers: [1]
        },
        "Reading": {
          topics: ["Phonics", "Reading Fluency", "Short Stories", "Comprehension - Simple"],
          papers: [1, 2]
        },
        "Writing": {
          topics: ["Sentence Writing", "Capital Letters", "Full Stops", "Simple Composition"],
          papers: [2]
        },
        "Grammar": {
          topics: ["Nouns", "Verbs", "Simple Tenses", "Singular/Plural"],
          papers: [2]
        }
      }
    },
    "Grade 3": {
      strands: {
        "Listening and Speaking": {
          topics: ["Oral Presentations", "Discussions", "Pronunciation", "Vocabulary Building"],
          papers: [1]
        },
        "Reading": {
          topics: ["Reading Comprehension", "Story Elements", "Main Ideas", "Details"],
          papers: [1, 2]
        },
        "Writing": {
          topics: ["Paragraph Writing", "Punctuation", "Descriptive Writing", "Letter Writing"],
          papers: [2]
        },
        "Grammar": {
          topics: ["Adjectives", "Pronouns", "Tenses", "Question Forms", "Prepositions"],
          papers: [2]
        }
      }
    },
    "Grade 4": {
      strands: {
        "Listening and Speaking": {
          topics: ["Formal Speaking", "Group Discussions", "Listening for Details", "Giving Directions"],
          papers: [1]
        },
        "Reading": {
          topics: ["Reading Fluency", "Inference", "Summarizing", "Text Structure"],
          papers: [1, 2]
        },
        "Writing": {
          topics: ["Narrative Writing", "Letter Writing", "Note Taking", "Editing"],
          papers: [2, 3]
        },
        "Grammar": {
          topics: ["Adverbs", "Conjunctions", "Complex Sentences", "Direct/Indirect Speech", "Active/Passive Voice"],
          papers: [2, 3]
        }
      }
    },
    "Grade 5": {
      strands: {
        "Listening and Speaking": {
          topics: ["Critical Listening", "Debates", "Presentations with Visual Aids", "Persuasive Speaking"],
          papers: [1]
        },
        "Reading": {
          topics: ["Analyzing Texts", "Comparing Texts", "Author's Purpose", "Literary Devices"],
          papers: [1, 2]
        },
        "Writing": {
          topics: ["Expository Writing", "Argumentative Writing", "Formal Letters", "Report Writing"],
          papers: [2, 3]
        },
        "Grammar": {
          topics: ["Clauses", "Phrases", "Sentence Variety", "Punctuation Rules", "Subject-Verb Agreement"],
          papers: [2, 3]
        }
      }
    },
    "Grade 6": {
      strands: {
        "Listening and Speaking": {
          topics: ["Public Speaking", "Panel Discussions", "Critical Analysis", "Oral Literature"],
          papers: [1]
        },
        "Reading": {
          topics: ["Literary Analysis", "Poetry Interpretation", "Critical Reading", "Research Skills"],
          papers: [1, 2]
        },
        "Writing": {
          topics: ["Essay Writing", "Creative Writing", "Business Letters", "Summary Writing"],
          papers: [2, 3]
        },
        "Grammar and Language Use": {
          topics: ["Advanced Grammar", "Figurative Language", "Stylistic Devices", "Cohesion and Coherence"],
          papers: [2, 3]
        }
      },
      paperMapping: {
        1: ["Listening and Speaking", "Reading"],
        2: ["Reading", "Writing", "Grammar and Language Use"],
        3: ["Writing", "Grammar and Language Use"]
      }
    },
    "Grade 7": {
      strands: {
        "Listening and Speaking": {
          topics: ["Advanced Presentations", "Critical Listening", "Debates and Discussions", "Oral Poetry"],
          papers: [1]
        },
        "Reading": {
          topics: ["Literary Texts", "Non-fiction Analysis", "Poetry", "Drama"],
          papers: [1, 2]
        },
        "Writing": {
          topics: ["Creative Writing", "Formal Writing", "Report Writing", "Letter Writing"],
          papers: [2]
        },
        "Grammar": {
          topics: ["Complex Grammar", "Idiomatic Expressions", "Register and Style", "Text Analysis"],
          papers: [1, 2]
        }
      }
    },
    "Grade 8": {
      strands: {
        "Listening and Speaking": {
          topics: ["Professional Communication", "Interview Skills", "Presentations", "Critical Response"],
          papers: [1]
        },
        "Reading": {
          topics: ["Critical Analysis", "Comparative Study", "Research and Reference", "Media Texts"],
          papers: [1, 2]
        },
        "Writing": {
          topics: ["Advanced Essay Writing", "Professional Writing", "Creative Pieces", "Research Papers"],
          papers: [2]
        },
        "Grammar and Language": {
          topics: ["Advanced Grammar Structures", "Stylistic Analysis", "Language and Context", "Discourse"],
          papers: [1, 2]
        }
      }
    },
    "Grade 9": {
      strands: {
        "Listening and Speaking": {
          topics: ["Presentations", "Debates", "Interviews", "Public Speaking", "Critical Listening"],
          papers: [1]
        },
        "Reading": {
          topics: ["Literary Analysis", "Poetry Analysis", "Non-fiction Texts", "Critical Reading", "Inference"],
          papers: [1, 2]
        },
        "Writing": {
          topics: ["Essay Writing", "Creative Writing", "Report Writing", "Business Letters", "Research Skills"],
          papers: [2]
        },
        "Grammar and Language Use": {
          topics: ["Complex Sentences", "Phrasal Verbs", "Idiomatic Expressions", "Figurative Language", "Text Analysis"],
          papers: [1, 2]
        },
        "Literature": {
          topics: ["Poetry", "Prose", "Drama", "Literary Devices", "Themes and Characterization"],
          papers: [1, 2]
        }
      },
      paperMapping: {
        1: ["Listening and Speaking", "Reading", "Grammar and Language Use", "Literature"],
        2: ["Reading", "Writing", "Grammar and Language Use", "Literature"]
      }
    }
  },
  Kiswahili: {
    "Grade 1": {
      strands: {
        "Kusoma na Kuandika": {
          topics: ["Herufi za Kiswahili", "Silabi", "Maneno Mepesi", "Picha za Kusoma"],
          papers: [1, 2]
        },
        "Kusikiliza na Kuzungumza": {
          topics: ["Masimulizi", "Nyimbo", "Mazungumzo", "Vitendo"],
          papers: [1]
        }
      }
    },
    "Grade 2": {
      strands: {
        "Kusoma": {
          topics: ["Kusoma Kwa Ufasaha", "Hadithi Fupi", "Ufahamu wa Maneno", "Picha"],
          papers: [1]
        },
        "Kuandika": {
          topics: ["Kuandika Sentensi", "Herufi Kubwa", "Alama za Uandishi", "Insha Fupi"],
          papers: [2]
        },
        "Sarufi": {
          topics: ["Nomino", "Vitenzi", "Nyakati", "Umoja/Wingi"],
          papers: [2]
        }
      }
    },
    "Grade 3": {
      strands: {
        "Kusoma": {
          topics: ["Ufahamu wa Habari", "Vipengele vya Hadithi", "Maana Kuu", "Maelezo"],
          papers: [1]
        },
        "Kuandika": {
          topics: ["Kuandika Aya", "Alama za Uandishi", "Kuandika Maelezo", "Barua"],
          papers: [2]
        },
        "Sarufi": {
          topics: ["Vivumishi", "Viwakilishi", "Nyakati za Vitenzi", "Viunganishi"],
          papers: [2]
        }
      }
    },
    "Grade 4": {
      strands: {
        "Kusoma": {
          topics: ["Kusoma kwa Kina", "Kuelewa Maana", "Muhtasari", "Muundo wa Maandishi"],
          papers: [1]
        },
        "Kuandika": {
          topics: ["Insha ya Simulizi", "Barua Rasmi", "Kuchukua Vidokezo", "Kuhariri"],
          papers: [2]
        },
        "Sarufi": {
          topics: ["Vielezi", "Sentensi Changamano", "Hotuba ya Moja kwa Moja/Isiyo ya Moja kwa Moja", "Kauli Halisi/Kauli Taarifa"],
          papers: [2]
        }
      }
    },
    "Grade 5": {
      strands: {
        "Kusoma": {
          topics: ["Uchambuzi wa Maandishi", "Kulinganisha Maandishi", "Kusudi la Mwandishi", "Sitiari na Tamathali"],
          papers: [1]
        },
        "Kuandika": {
          topics: ["Insha ya Maelezo", "Insha ya Hoja", "Barua Rasmi", "Ripoti"],
          papers: [2]
        },
        "Sarufi": {
          topics: ["Vishazi", "Misemo", "Aina za Sentensi", "Sheria za Uandishi", "Patano"],
          papers: [2]
        }
      }
    },
    "Grade 6": {
      strands: {
        "Kusoma": {
          topics: ["Ufahamu wa Vifungu", "Uchambuzi wa Fasihi", "Ushairi", "Kusoma kwa Makini"],
          papers: [1]
        },
        "Kuandika": {
          topics: ["Insha", "Ubunifu wa Kuandika", "Barua za Biashara", "Muhtasari"],
          papers: [2]
        },
        "Lugha": {
          topics: ["Sarufi ya Juu", "Tamathali za Lugha", "Mbinu za Kisanaa", "Mshikamano na Utaratibu"],
          papers: [1, 2]
        },
        "Fasihi": {
          topics: ["Fasihi Simulizi", "Ushairi", "Hadithi", "Tamthilia"],
          papers: [2]
        }
      },
      paperMapping: {
        1: ["Kusoma", "Lugha"],
        2: ["Kuandika", "Lugha", "Fasihi"]
      }
    },
    "Grade 7": {
      strands: {
        "Kusoma na Kusikiliza": {
          topics: ["Maandishi ya Fasihi", "Uchambuzi Usio wa Fasihi", "Ushairi", "Riwaya"],
          papers: [1]
        },
        "Kuandika na Kuzungumza": {
          topics: ["Ubunifu wa Kuandika", "Maandishi Rasmi", "Ripoti", "Barua"],
          papers: [2]
        },
        "Lugha": {
          topics: ["Sarufi Changamano", "Misemo ya Kimila", "Mtindo", "Uchambuzi wa Maandishi"],
          papers: [1, 2]
        },
        "Fasihi": {
          topics: ["Riwaya", "Hadithi Fupi", "Ushairi", "Tamthilia"],
          papers: [1, 2]
        }
      }
    },
    "Grade 8": {
      strands: {
        "Kusoma": {
          topics: ["Uchambuzi Makini", "Uchunguzi wa Kulinganisha", "Utafiti", "Maandishi ya Vyombo vya Habari"],
          papers: [1]
        },
        "Kuandika": {
          topics: ["Insha za Juu", "Maandishi ya Kitaalamu", "Vipande vya Ubunifu", "Karatasi za Utafiti"],
          papers: [2]
        },
        "Lugha": {
          topics: ["Miundo ya Sarufi ya Juu", "Uchambuzi wa Mtindo", "Lugha na Muktadha"],
          papers: [1, 2]
        },
        "Fasihi": {
          topics: ["Uchambuzi wa Fasihi", "Tanzu za Fasihi", "Mandhari na Wahusika"],
          papers: [1, 2]
        }
      }
    },
    "Grade 9": {
      strands: {
        "Ufahamu": {
          topics: ["Vifungu vya Ufahamu", "Mbinu za Kusoma", "Maswali ya Ufahamu"],
          papers: [1]
        },
        "Lugha": {
          topics: ["Sarufi", "Matumizi ya Lugha", "Methali na Misemo", "Nahau"],
          papers: [1]
        },
        "Fasihi Andishi": {
          topics: ["Riwaya", "Tamthilia", "Ushairi"],
          papers: [2]
        },
        "Fasihi Simulizi": {
          topics: ["Hadithi", "Methali", "Vitendawili", "Nyimbo"],
          papers: [2]
        },
        "Insha": {
          topics: ["Insha ya Maelezo", "Insha ya Hoja", "Insha ya Simulizi", "Barua Rasmi"],
          papers: [2]
        }
      },
      paperMapping: {
        1: ["Ufahamu", "Lugha"],
        2: ["Insha", "Fasihi Simulizi", "Fasihi Andishi"]
      }
    }
  },
  "Integrated Science": {
    "Grade 4": {
      strands: {
        "Living Things": {
          topics: ["Parts of Plants", "Parts of Animals", "Life Cycles", "Animal Movement", "Plant Growth"],
          papers: [1]
        },
        "Materials": {
          topics: ["Properties of Materials", "States of Matter", "Uses of Materials"],
          papers: [1]
        },
        "Energy": {
          topics: ["Light", "Sound", "Heat", "Simple Electricity"],
          papers: [2]
        },
        "Forces": {
          topics: ["Push and Pull", "Friction", "Magnetism"],
          papers: [2]
        }
      }
    },
    "Grade 5": {
      strands: {
        "Living Things": {
          topics: ["Classification", "Body Systems", "Nutrition", "Health and Hygiene"],
          papers: [1]
        },
        "Materials and Matter": {
          topics: ["Mixtures", "Solutions", "Separating Mixtures"],
          papers: [1]
        },
        "Energy": {
          topics: ["Electricity", "Energy Transfer", "Renewable Energy"],
          papers: [2]
        },
        "Forces and Motion": {
          topics: ["Motion", "Gravity", "Simple Machines"],
          papers: [2]
        }
      }
    },
    "Grade 6": {
      strands: {
        "Living Things": {
          topics: ["Classification", "Life Processes", "Human Body Systems", "Reproduction", "Ecosystems", "Food Chains"],
          papers: [1]
        },
        "Materials and Matter": {
          topics: ["Properties of Matter", "States of Matter", "Mixtures and Solutions", "Separation Techniques", "Acids and Bases"],
          papers: [1]
        },
        "Energy": {
          topics: ["Forms of Energy", "Energy Transfer", "Light", "Sound", "Electricity", "Magnetism"],
          papers: [2]
        },
        "Forces and Motion": {
          topics: ["Types of Forces", "Friction", "Gravity", "Simple Machines", "Work and Power"],
          papers: [2]
        },
        "Earth and Space": {
          topics: ["Weather and Climate", "Solar System", "Day and Night", "Seasons", "Earth Resources"],
          papers: [2]
        }
      },
      paperMapping: {
        1: ["Living Things", "Materials and Matter"],
        2: ["Energy", "Forces and Motion", "Earth and Space"]
      }
    },
    "Grade 7": {
      strands: {
        "Biology": {
          topics: ["Cell Structure", "Classification of Living Things", "Nutrition in Plants and Animals", "Respiration", "Excretion"],
          papers: [1]
        },
        "Chemistry": {
          topics: ["Elements, Compounds, Mixtures", "Atomic Structure", "Chemical Reactions", "Acids, Bases, Salts"],
          papers: [1]
        },
        "Physics": {
          topics: ["Measurement", "Forces", "Energy", "Light and Optics", "Electricity"],
          papers: [2]
        }
      }
    },
    "Grade 8": {
      strands: {
        "Biology": {
          topics: ["Transport in Plants and Animals", "Reproduction", "Growth and Development", "Ecosystems and Environment"],
          papers: [1]
        },
        "Chemistry": {
          topics: ["Periodic Table", "Chemical Bonding", "Rates of Reaction", "Electrochemistry"],
          papers: [1]
        },
        "Physics": {
          topics: ["Mechanics", "Heat", "Waves", "Magnetism", "Electronics"],
          papers: [2]
        }
      }
    },
    "Grade 9": {
      strands: {
        "Biology": {
          topics: ["Cell Structure", "Cell Division", "Genetics", "Evolution", "Biotechnology", "Disease and Immunity"],
          papers: [1]
        },
        "Chemistry": {
          topics: ["Atomic Structure", "Chemical Bonding", "Chemical Reactions", "Acids, Bases, Salts", "Organic Chemistry - Introduction"],
          papers: [1]
        },
        "Physics": {
          topics: ["Mechanics", "Waves", "Electricity and Magnetism", "Modern Physics", "Nuclear Physics - Introduction"],
          papers: [2]
        }
      },
      paperMapping: {
        1: ["Biology", "Chemistry"],
        2: ["Physics"]
      }
    }
  },
  "Social Studies": {
    "Grade 4": {
      strands: {
        "Geography": {
          topics: ["My County", "Physical Features", "Weather", "Map Reading"],
          papers: [1]
        },
        "History": {
          topics: ["My Community", "Historical Events", "People and Culture"],
          papers: [1]
        },
        "Citizenship": {
          topics: ["Rights and Responsibilities", "National Symbols", "Community Service"],
          papers: [1]
        }
      }
    },
    "Grade 5": {
      strands: {
        "Geography": {
          topics: ["Kenya's Physical Features", "Climate", "Vegetation", "Natural Resources"],
          papers: [1]
        },
        "History": {
          topics: ["Pre-colonial Kenya", "Colonial Period", "Road to Independence"],
          papers: [1]
        },
        "Government": {
          topics: ["Government Structure", "Democracy", "Elections"],
          papers: [1]
        }
      }
    },
    "Grade 6": {
      strands: {
        "Geography": {
          topics: ["Eastern Africa", "Physical Geography", "Economic Activities", "Population"],
          papers: [1]
        },
        "History": {
          topics: ["Early Civilizations", "Trade Routes", "Colonialism", "Independence Movements"],
          papers: [1]
        },
        "Citizenship and Government": {
          topics: ["Constitution", "Human Rights", "Democracy", "International Relations"],
          papers: [1]
        }
      }
    },
    "Grade 7": {
      strands: {
        "Geography": {
          topics: ["Africa's Geography", "Climate Zones", "Population Distribution", "Economic Development"],
          papers: [1]
        },
        "History": {
          topics: ["Ancient Civilizations", "Trans-Saharan Trade", "European Exploration", "Scramble for Africa"],
          papers: [1]
        },
        "Citizenship": {
          topics: ["African Unity", "Regional Organizations", "Governance", "Development"],
          papers: [1]
        }
      }
    },
    "Grade 8": {
      strands: {
        "Geography": {
          topics: ["World Geography", "Climate Change", "Globalization", "Sustainable Development"],
          papers: [1]
        },
        "History": {
          topics: ["World Wars", "Cold War", "Independence Movements", "Modern History"],
          papers: [1]
        },
        "Political Systems": {
          topics: ["International Organizations", "Global Issues", "Peace and Security"],
          papers: [1]
        }
      }
    },
    "Grade 9": {
      strands: {
        "Geography": {
          topics: ["Physical Geography", "Human Geography", "Economic Geography", "Environmental Issues"],
          papers: [1]
        },
        "History": {
          topics: ["Pre-colonial Africa", "Colonialism", "Nationalism", "Post-Independence Africa"],
          papers: [1]
        },
        "Government and Citizenship": {
          topics: ["Constitution", "Democracy", "Human Rights", "International Relations"],
          papers: [1]
        }
      }
    }
  },
  "Agriculture and Nutrition": {
    "Grade 7": {
      strands: {
        "Crop Production": {
          topics: ["Crop Classification", "Land Preparation", "Planting", "Crop Management"],
          papers: [1]
        },
        "Livestock Production": {
          topics: ["Types of Livestock", "Housing", "Feeding", "Health"],
          papers: [1]
        },
        "Nutrition": {
          topics: ["Balanced Diet", "Food Groups", "Nutritional Disorders"],
          papers: [1]
        }
      }
    },
    "Grade 8": {
      strands: {
        "Crop Production": {
          topics: ["Soil Management", "Crop Rotation", "Pest and Disease Control", "Harvesting"],
          papers: [1]
        },
        "Livestock Management": {
          topics: ["Breeding", "Record Keeping", "Marketing", "Value Addition"],
          papers: [1]
        },
        "Food and Nutrition": {
          topics: ["Food Preservation", "Food Safety", "Meal Planning"],
          papers: [1]
        }
      }
    },
    "Grade 9": {
      strands: {
        "Agricultural Production": {
          topics: ["Agribusiness", "Farm Management", "Agricultural Economics", "Marketing"],
          papers: [1]
        },
        "Animal Husbandry": {
          topics: ["Livestock Systems", "Breeds", "Production", "Marketing"],
          papers: [1]
        },
        "Food and Nutrition": {
          topics: ["Nutrition and Health", "Food Processing", "Food Security", "Consumer Education"],
          papers: [1]
        }
      }
    }
  },
  "CRE": {
    "Grade 7": {
      strands: {
        "Old Testament": {
          topics: ["Creation", "The Fall", "The Patriarchs", "Moses and the Exodus"],
          papers: [1]
        },
        "New Testament": {
          topics: ["Life of Jesus", "Teachings of Jesus", "Miracles", "Parables"],
          papers: [1]
        },
        "Christian Living": {
          topics: ["Christian Values", "Family", "Church", "Community"],
          papers: [1]
        }
      }
    },
    "Grade 8": {
      strands: {
        "Biblical Studies": {
          topics: ["The Prophets", "Kings and Kingdoms", "Early Church", "Apostles"],
          papers: [1]
        },
        "Christian Ethics": {
          topics: ["Morality", "Social Justice", "Environmental Stewardship"],
          papers: [1]
        },
        "Contemporary Issues": {
          topics: ["Youth Challenges", "Technology", "Globalization"],
          papers: [1]
        }
      }
    },
    "Grade 9": {
      strands: {
        "Old Testament": {
          topics: ["Creation and Fall", "Covenants", "The Prophets", "Wisdom Literature"],
          papers: [1]
        },
        "New Testament": {
          topics: ["Life and Ministry of Jesus", "Early Church", "Paul's Letters", "Revelation"],
          papers: [1]
        },
        "Christian Living": {
          topics: ["Christian Ethics", "Social Responsibility", "Christian Leadership", "Contemporary Challenges"],
          papers: [1]
        }
      }
    }
  },
  "IRE": {
    "Grade 9": {
      strands: {
        "Quran and Hadith": {
          topics: ["Selected Surahs", "Tafsir", "Hadith Studies", "Islamic Teachings"],
          papers: [1]
        },
        "Islamic History": {
          topics: ["Life of Prophet Muhammad", "Khulafa Rashidun", "Islamic Civilization"],
          papers: [1]
        },
        "Islamic Practice": {
          topics: ["Pillars of Islam", "Islamic Ethics", "Social Life", "Contemporary Issues"],
          papers: [1]
        }
      }
    }
  },
  "HRE": {
    "Grade 9": {
      strands: {
        "Hindu Scriptures": {
          topics: ["Vedas", "Upanishads", "Bhagavad Gita", "Ramayana"],
          papers: [1]
        },
        "Hindu Philosophy": {
          topics: ["Dharma", "Karma", "Moksha", "Yoga"],
          papers: [1]
        },
        "Hindu Practice": {
          topics: ["Rituals", "Festivals", "Ethics", "Contemporary Issues"],
          papers: [1]
        }
      }
    }
  },
  "Creative Arts and Sports": {
    "Grade 9": {
      strands: {
        "Visual Arts": {
          topics: ["Drawing", "Painting", "Sculpture", "Design", "Art Appreciation"],
          papers: [1, 2]
        },
        "Performing Arts": {
          topics: ["Music", "Dance", "Drama", "Theatre Arts"],
          papers: [1, 2]
        },
        "Sports": {
          topics: ["Athletics", "Ball Games", "Indigenous Games", "Sports Science"],
          papers: [1, 2]
        }
      },
      paperMapping: {
        1: ["Visual Arts", "Performing Arts", "Sports"],
        2: ["Visual Arts", "Performing Arts", "Sports"]
      }
    }
  },
  "Pre-Technical Studies": {
    "Grade 9": {
      strands: {
        "Technology and Design": {
          topics: ["Design Process", "Technical Drawing", "Materials", "Tools and Equipment"],
          papers: [1]
        },
        "Construction": {
          topics: ["Building Materials", "Construction Techniques", "Safety"],
          papers: [1]
        },
        "Electronics": {
          topics: ["Basic Circuits", "Components", "Safety", "Applications"],
          papers: [1]
        },
        "Practical Project": {
          topics: ["Project Planning", "Implementation", "Testing", "Evaluation"],
          papers: [2]
        }
      },
      paperMapping: {
        1: ["Technology and Design", "Construction", "Electronics"],
        2: ["Practical Project"]
      }
    }
  },
  "German (JS)": {
    "Grade 7": {
      strands: {
        "Listening and Speaking": {
          topics: ["Greetings", "Introductions", "Basic Conversations", "Pronunciation"],
          papers: [1]
        },
        "Reading": {
          topics: ["Simple Texts", "Vocabulary", "Basic Grammar"],
          papers: [1]
        },
        "Writing": {
          topics: ["Alphabet", "Simple Sentences", "Basic Vocabulary"],
          papers: [1]
        }
      }
    },
    "Grade 8": {
      strands: {
        "Listening and Speaking": {
          topics: ["Conversations", "Descriptions", "Directions", "Requests"],
          papers: [1]
        },
        "Reading and Comprehension": {
          topics: ["Short Stories", "Dialogues", "Information Texts"],
          papers: [1]
        },
        "Writing": {
          topics: ["Letters", "Messages", "Short Compositions"],
          papers: [1]
        },
        "Grammar": {
          topics: ["Articles", "Nouns", "Verbs", "Cases", "Sentence Structure"],
          papers: [1]
        }
      }
    },
    "Grade 9": {
      strands: {
        "Listening and Speaking": {
          topics: ["Presentations", "Discussions", "Expressing Opinions", "Formal Communication"],
          papers: [1]
        },
        "Reading": {
          topics: ["Literary Texts", "Media Texts", "Comprehension", "Analysis"],
          papers: [1]
        },
        "Writing": {
          topics: ["Essays", "Formal Letters", "Reports", "Creative Writing"],
          papers: [1]
        },
        "Grammar and Language Use": {
          topics: ["Advanced Grammar", "Idioms", "Complex Sentences", "Stylistic Devices"],
          papers: [1]
        }
      }
    }
  },
  "French (JS)": {
    "Grade 7": {
      strands: {
        "Listening and Speaking": {
          topics: ["Greetings", "Self-Introduction", "Basic Conversations", "Numbers and Dates"],
          papers: [1]
        },
        "Reading": {
          topics: ["Simple Texts", "Vocabulary Building", "Basic Grammar"],
          papers: [1]
        },
        "Writing": {
          topics: ["Alphabet", "Simple Sentences", "Personal Information"],
          papers: [1]
        }
      }
    },
    "Grade 8": {
      strands: {
        "Listening and Speaking": {
          topics: ["Everyday Conversations", "Describing People and Places", "Shopping", "Directions"],
          papers: [1]
        },
        "Reading": {
          topics: ["Short Stories", "Dialogues", "Cultural Texts"],
          papers: [1]
        },
        "Writing": {
          topics: ["Personal Letters", "Messages", "Descriptions"],
          papers: [1]
        },
        "Grammar": {
          topics: ["Articles", "Adjectives", "Verbs", "Tenses", "Sentence Structure"],
          papers: [1]
        }
      }
    },
    "Grade 9": {
      strands: {
        "Listening and Speaking": {
          topics: ["Presentations", "Debates", "Expressing Opinions", "Formal Speech"],
          papers: [1]
        },
        "Reading": {
          topics: ["Literary Texts", "Articles", "Comprehension", "Critical Reading"],
          papers: [1]
        },
        "Writing": {
          topics: ["Essays", "Formal Letters", "Reports", "Creative Pieces"],
          papers: [1]
        },
        "Grammar": {
          topics: ["Complex Grammar", "Subjunctive", "Pronouns", "Advanced Structures"],
          papers: [1]
        }
      }
    }
  },
  "Arabic (JS)": {
    "Grade 7": {
      strands: {
        "Listening and Speaking": {
          topics: ["Greetings", "Introductions", "Basic Phrases", "Pronunciation"],
          papers: [1]
        },
        "Reading": {
          topics: ["Arabic Alphabet", "Simple Words", "Short Sentences", "Vocabulary"],
          papers: [1]
        },
        "Writing": {
          topics: ["Letter Writing", "Word Formation", "Basic Sentences"],
          papers: [1]
        }
      }
    },
    "Grade 8": {
      strands: {
        "Listening and Speaking": {
          topics: ["Conversations", "Descriptions", "Questions and Answers", "Oral Presentations"],
          papers: [1]
        },
        "Reading": {
          topics: ["Short Texts", "Stories", "Comprehension", "Vocabulary Development"],
          papers: [1]
        },
        "Writing": {
          topics: ["Letters", "Messages", "Short Compositions", "Grammar Practice"],
          papers: [1]
        },
        "Grammar": {
          topics: ["Nouns", "Verbs", "Sentence Structure", "Tenses"],
          papers: [1]
        }
      }
    },
    "Grade 9": {
      strands: {
        "Listening and Speaking": {
          topics: ["Formal Communication", "Discussions", "Presentations", "Debates"],
          papers: [1]
        },
        "Reading": {
          topics: ["Literary Texts", "Media Texts", "Analysis", "Critical Reading"],
          papers: [1]
        },
        "Writing": {
          topics: ["Essays", "Formal Letters", "Reports", "Creative Writing"],
          papers: [1]
        },
        "Grammar": {
          topics: ["Advanced Grammar", "Complex Sentences", "Rhetorical Devices", "Classical Arabic"],
          papers: [1]
        }
      }
    }
  },
  "Computer Science (JS)": {
    "Grade 7": {
      strands: {
        "Computer Basics": {
          topics: ["Computer Hardware", "Operating Systems", "File Management", "Input/Output Devices"],
          papers: [1]
        },
        "Programming Fundamentals": {
          topics: ["Introduction to Programming", "Algorithms", "Flowcharts", "Basic Coding"],
          papers: [1]
        },
        "Digital Literacy": {
          topics: ["Internet Safety", "Digital Citizenship", "Online Communication"],
          papers: [1]
        }
      }
    },
    "Grade 8": {
      strands: {
        "Programming": {
          topics: ["Variables", "Data Types", "Control Structures", "Functions"],
          papers: [1]
        },
        "Applications": {
          topics: ["Word Processing", "Spreadsheets", "Presentations", "Databases"],
          papers: [1]
        },
        "Networks": {
          topics: ["Network Basics", "Internet", "Email", "Web Browsing"],
          papers: [1]
        }
      }
    },
    "Grade 9": {
      strands: {
        "Programming and Development": {
          topics: ["Object-Oriented Programming", "Data Structures", "Algorithms", "Problem Solving"],
          papers: [1]
        },
        "Web Development": {
          topics: ["HTML", "CSS", "JavaScript Basics", "Web Design Principles"],
          papers: [1]
        },
        "Data and Information": {
          topics: ["Database Management", "Data Analysis", "Spreadsheet Advanced", "Information Systems"],
          papers: [1]
        },
        "Emerging Technologies": {
          topics: ["AI Basics", "Cybersecurity", "Cloud Computing", "Digital Ethics"],
          papers: [1]
        }
      }
    }
  },
  "Business Studies (JS)": {
    "Grade 9": {
      strands: {
        "Introduction to Business": {
          topics: ["Business Concepts", "Business Environment", "Types of Business", "Entrepreneurship"],
          papers: [1]
        },
        "Production": {
          topics: ["Factors of Production", "Production Process", "Quality Control", "Technology in Production"],
          papers: [1]
        },
        "Marketing": {
          topics: ["Marketing Concepts", "Market Research", "Marketing Mix", "Consumer Behavior"],
          papers: [1]
        },
        "Finance and Accounting": {
          topics: ["Business Finance", "Sources of Capital", "Record Keeping", "Financial Statements"],
          papers: [1]
        }
      }
    }
  },
  "Home Science (JS)": {
    "Grade 9": {
      strands: {
        "Food and Nutrition": {
          topics: ["Nutrition Principles", "Food Groups", "Meal Planning", "Food Preservation", "Food Safety"],
          papers: [1]
        },
        "Clothing and Textiles": {
          topics: ["Fibers and Fabrics", "Clothing Construction", "Clothing Care", "Fashion Design"],
          papers: [1]
        },
        "Home Management": {
          topics: ["Home Economics", "Resource Management", "Family Living", "Consumer Education"],
          papers: [1]
        }
      }
    }
  },
  "Music (JS)": {
    "Grade 9": {
      strands: {
        "Music Theory": {
          topics: ["Staff Notation", "Scales", "Intervals", "Chords", "Rhythm"],
          papers: [1, 2]
        },
        "Music Performance": {
          topics: ["Vocal Techniques", "Instrumental Skills", "Ensemble Performance"],
          papers: [2]
        },
        "Music Appreciation": {
          topics: ["Kenyan Music", "African Music", "World Music", "Music History", "Musical Analysis"],
          papers: [1]
        },
        "Music Composition": {
          topics: ["Melody Writing", "Harmony", "Arrangement", "Creative Composition"],
          papers: [2]
        }
      },
      paperMapping: {
        1: ["Music Theory", "Music Appreciation"],
        2: ["Music Theory", "Music Performance", "Music Composition"]
      }
    }
  }
};

// PP subjects - Pre-primary specific
export const PP_TOPICS_CONFIG: TopicConfig = {
  "Mathematical Activities": {
    "PP1": {
      strands: {
        "Numbers": {
          topics: ["Counting 1-5", "Number Recognition 1-5", "More/Less", "One-to-One Correspondence"],
          papers: [1]
        },
        "Patterns": {
          topics: ["Color Patterns", "Shape Patterns", "Sound Patterns"],
          papers: [1]
        },
        "Shapes": {
          topics: ["Circle", "Square", "Triangle"],
          papers: [1]
        },
        "Measurement": {
          topics: ["Big/Small", "Long/Short", "Heavy/Light"],
          papers: [1]
        }
      }
    },
    "PP2": {
      strands: {
        "Numbers": {
          topics: ["Counting 1-10", "Number Recognition 1-10", "Before/After", "Ordering Numbers", "Simple Addition"],
          papers: [1]
        },
        "Patterns": {
          topics: ["Complex Patterns", "Movement Patterns", "Number Patterns"],
          papers: [1]
        },
        "Shapes": {
          topics: ["Circle", "Square", "Triangle", "Rectangle", "Oval"],
          papers: [1]
        },
        "Measurement": {
          topics: ["Length Comparison", "Weight Comparison", "Capacity - Full/Empty", "Time - Day/Night"],
          papers: [1]
        }
      }
    }
  },
  "Literacy Activities": {
    "PP1": {
      strands: {
        "Listening": {
          topics: ["Listen to Stories", "Follow Simple Instructions", "Sound Recognition"],
          papers: [1]
        },
        "Speaking": {
          topics: ["Name Objects", "Simple Sentences", "Describe Pictures"],
          papers: [1]
        },
        "Pre-reading": {
          topics: ["Letter Recognition A-M", "Letter Sounds", "Picture Reading"],
          papers: [1]
        },
        "Pre-writing": {
          topics: ["Tracing", "Coloring", "Drawing Lines", "Holding Pencil"],
          papers: [1]
        }
      }
    },
    "PP2": {
      strands: {
        "Listening": {
          topics: ["Listen to Longer Stories", "Follow Multi-step Instructions", "Identify Sounds"],
          papers: [1]
        },
        "Speaking": {
          topics: ["Tell Stories", "Express Needs", "Answer Questions", "Role Play"],
          papers: [1]
        },
        "Reading": {
          topics: ["Letter Recognition A-Z", "Letter Sounds", "Simple Words", "Own Name"],
          papers: [1]
        },
        "Writing": {
          topics: ["Letter Formation", "Name Writing", "Simple Words", "Copy Writing"],
          papers: [1]
        }
      }
    }
  }
};

// Helper function to get topics for a specific class and subject
export const getTopicsForClass = (
  subject: string,
  classLevel: string,
  paperNumber?: number
): { [strand: string]: string[] } | null => {
  // Check PP subjects first
  const ppConfig = PP_TOPICS_CONFIG[subject]?.[classLevel];
  if (ppConfig) {
    const result: { [strand: string]: string[] } = {};
    Object.entries(ppConfig.strands).forEach(([strand, config]) => {
      // If paper number specified, only include strands for that paper
      if (paperNumber && config.papers && !config.papers.includes(paperNumber)) {
        return;
      }
      result[strand] = config.topics;
    });
    return result;
  }

  // Check regular subjects
  const subjectConfig = EXAM_TOPICS_CONFIG[subject]?.[classLevel];
  if (!subjectConfig) return null;

  const result: { [strand: string]: string[] } = {};

  // CRITICAL: If paper mapping exists, ONLY use paper mapping (ignore paper arrays in strands)
  if (paperNumber && subjectConfig.paperMapping) {
    const strandsForPaper = subjectConfig.paperMapping[paperNumber];
    if (strandsForPaper) {
      // Only return strands that are in the paper mapping
      strandsForPaper.forEach(strandName => {
        const strandConfig = subjectConfig.strands[strandName];
        if (strandConfig) {
          result[strandName] = strandConfig.topics;
        }
      });
      return result;
    }
    // If paper number not in mapping, return empty (no topics for invalid paper)
    return {};
  }

  // If no paper mapping but paper number specified, use paper arrays in strands
  if (paperNumber) {
    Object.entries(subjectConfig.strands).forEach(([strand, config]) => {
      if (config.papers && !config.papers.includes(paperNumber)) {
        return;
      }
      result[strand] = config.topics;
    });
    return result;
  }

  // No paper number specified, return all strands
  Object.entries(subjectConfig.strands).forEach(([strand, config]) => {
    result[strand] = config.topics;
  });

  return result;
};

// Get available strands for class and subject
export const getStrandsForClass = (
  subject: string,
  classLevel: string,
  paperNumber?: number
): string[] => {
  const topics = getTopicsForClass(subject, classLevel, paperNumber);
  return topics ? Object.keys(topics) : [];
};

// Get paper configuration for subject and class
export const getPaperConfig = (subject: string, classLevel: string): ExamPaperConfig | null => {
  return EXAM_PAPER_CONFIGS[subject]?.[classLevel] || null;
};
