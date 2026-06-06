const links = {
  linkedin: "https://www.linkedin.com/in/sankalp212/",
  github: "https://github.com/sankalpshukla7474-creator",
  portfolio: "https://sankalpshukla7474-creator.github.io/Sankalp_Portfolio/"
};

export function recruiterAnswer(query: string) {
  const text = query.toLowerCase();

  if (hasAny(text, ["portfolio", "website", "site", "linkedin", "github link", "profile link"])) {
    return [
      "Verified links:",
      `- Portfolio: ${links.portfolio}`,
      `- GitHub: ${links.github}`,
      `- LinkedIn: ${links.linkedin}`
    ].join("\n");
  }

  if (hasAny(text, ["where do", "where he work", "where does", "current role", "experience", "internship"])) {
    return [
      "Sankalp's verified experience:",
      "- Junior AI Engineer Intern at Globe Spring Solutions: LLM pipelines, RAG, LangChain/LangGraph, n8n automation. [Resume]",
      "- Machine Learning Engineer Intern at Globe Spring Solutions: ML pipelines, FastAPI workflows, MLflow tracking. [Resume]",
      "- Freelance AI & Automation Engineer: RAG systems, custom AI agents, and n8n workflows. [Portfolio]"
    ].join("\n");
  }

  if (hasAny(text, ["skill", "tech stack", "technology", "technologies"])) {
    return [
      "Sankalp's core skills:",
      "- LLM/RAG: LangChain, LangGraph, Llama 3, GPT, BERT, Pinecone, Chroma. [Resume]",
      "- ML engineering: PyTorch, TensorFlow, Scikit-learn, XGBoost, MLflow. [Resume]",
      "- Backend/automation: FastAPI, Flask, n8n, REST webhooks, Docker, AWS, Vercel. [Resume]"
    ].join("\n");
  }

  if (hasAny(text, ["github", "repo", "repositories", "repository"])) {
    return [
      "Best repositories to review:",
      `- AI Resume Builder: LLM + n8n workflow that tailors resumes and generates PDFs. ${links.github}/resume_builder [GitHub]`,
      `- LangChain Healthcare AI: FastAPI/React AI triage assistant using Gemini. ${links.github}/langchain-healthcare-ai [GitHub]`,
      `- AI-Powered Judiciary: legal RAG and hallucination-verification system. ${links.github}/AI-Powered-Judiciary [GitHub]`
    ].join("\n");
  }

  if (hasAny(text, ["project", "agent", "automation", "built"])) {
    return [
      "Relevant AI projects:",
      "- AI Resume Builder: JD parsing, resume tailoring, PDF generation, Google Drive logging, and n8n orchestration. [Resume/GitHub]",
      "- Judicial RAG System: precedent retrieval, trust scoring, hallucination detection, FastAPI/Docker/AWS deployment. [Resume/Portfolio]",
      "- Healthcare AI Chatbot: multi-turn AI assistant with FastAPI/React deployment and Gemini integration. [Resume/GitHub]"
    ].join("\n");
  }

  if (hasAny(text, ["fit", "why", "strong", "role", "hire"])) {
    return [
      "Sankalp is a strong fit for an AI engineering role because:",
      "- He has hands-on LLM/RAG experience with LangChain, LangGraph, Llama, Pinecone, and evaluation metrics. [Resume]",
      "- He has built deployed AI products, not only notebooks: resume automation, legal RAG, healthcare AI, and anomaly detection. [Resume/GitHub]",
      "- He also understands integrations: FastAPI, n8n, REST webhooks, Docker, AWS, and Vercel. [Resume]"
    ].join("\n");
  }

  return null;
}

function hasAny(text: string, terms: string[]) {
  return terms.some((term) => text.includes(term));
}
