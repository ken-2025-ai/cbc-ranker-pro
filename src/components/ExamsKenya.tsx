import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, Plus, History } from "lucide-react";
import ExamGenerator from "./exams/ExamGenerator";
import ExamHistory from "./exams/ExamHistory";

const ExamsKenya = () => {
  const [activeTab, setActiveTab] = useState("generate");

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/10 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent mb-2">
            Exams Kenya
          </h1>
          <p className="text-muted-foreground">
            AI-powered KNEC/CBC exam generation system - KPSEA, KJSEA compliant
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="generate" className="gap-2">
              <Plus className="h-4 w-4" />
              Generate Exam
            </TabsTrigger>
            <TabsTrigger value="history" className="gap-2">
              <History className="h-4 w-4" />
              Exam History
            </TabsTrigger>
          </TabsList>

          <TabsContent value="generate" className="space-y-6">
            <ExamGenerator />
          </TabsContent>

          <TabsContent value="history" className="space-y-6">
            <ExamHistory />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default ExamsKenya;