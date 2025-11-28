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
          papers: [1, 2]
        },
        "Measurement and Mensuration": {
          topics: ["Arc Length", "Sector Area", "Volume - Pyramids and Cones", "Surface Area - Complex Shapes", "Latitude and Longitude"],
          papers: [2]
        },
        "Geometry and Trigonometry": {
          topics: ["Circle Theorems", "Trigonometric Ratios", "Angles of Elevation and Depression", "3D Geometry", "Vectors - Introduction"],
          papers: [2]
        },
        "Statistics and Probability": {
          topics: ["Measures of Dispersion", "Probability Distributions", "Sampling", "Statistical Inference - Introduction"],
          papers: [2]
        }
      },
      paperMapping: {
        1: ["Numbers and Operations", "Algebra", "Financial Mathematics"],
        2: ["Measurement and Mensuration", "Geometry and Trigonometry", "Statistics and Probability", "Financial Mathematics"]
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
          papers: [1]
        }
      },
      paperMapping: {
        1: ["Listening and Speaking", "Reading", "Grammar and Language Use", "Literature"],
        2: ["Reading", "Writing", "Grammar and Language Use"]
      }
    }
  },
  Science: {
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

  // If paper mapping exists and paper number is specified
  if (paperNumber && subjectConfig.paperMapping) {
    const strandsForPaper = subjectConfig.paperMapping[paperNumber];
    if (strandsForPaper) {
      strandsForPaper.forEach(strandName => {
        const strandConfig = subjectConfig.strands[strandName];
        if (strandConfig) {
          result[strandName] = strandConfig.topics;
        }
      });
      return result;
    }
  }

  // Otherwise, return all strands (filtering by paper if specified)
  Object.entries(subjectConfig.strands).forEach(([strand, config]) => {
    if (paperNumber && config.papers && !config.papers.includes(paperNumber)) {
      return;
    }
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
