# AI Research War Room

An advanced multi-agent system for complex query analysis, evidence verification, and strategic decision-making.

## Architecture

- **Frontend**: React + Vite (Cyber-Luxe Dark Mode)
- **Backend**: FastAPI + Agentic Pipeline
- **Agents**: Specialized roles (Domain, Planner, Retriever, Analyzer, Verifier, Critic, Debate, Decision, Action)
- **Integrations**: OpenAI, arXiv

## Setup

### Backend
1. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
2. Configure `.env` with your API keys.
3. Run the server:
   ```bash
   python -m backend.main
   ```

### Frontend
1. Install dependencies:
   ```bash
   cd frontend
   npm install
   ```
2. Run the dev server:
   ```bash
   npm run dev
   ```

## Workflow
1. User submits a research query.
2. **Domain Agent** categorizes the query.
3. **Planner Agent** designs a research strategy.
4. **Retriever Agent** fetches data from arXiv.
5. **Analyzer Agent** synthesizes the data.
6. **Verifier Agent** checks for accuracy.
7. **Critic Agent** identifies risks and contradictions.
8. **Debate Agent** simulates a debate between analysis and criticism.
9. **Decision Agent** makes the final call.
10. **Action Agent** provides implementation steps.
