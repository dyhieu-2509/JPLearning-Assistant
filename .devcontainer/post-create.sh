#!/bin/bash
set -e

echo "=========================================="
echo "  JPLearning Assistant — Post-Create Setup"
echo "=========================================="

# --- Python AI Service ---
echo "[1/3] Setting up Python AI Service..."
if [ -f ai-service/requirements.txt ]; then
    pip install --upgrade pip
    pip install -r ai-service/requirements.txt
    echo "  ✅ Python dependencies installed"
else
    pip install --upgrade pip
    pip install fastapi uvicorn langchain langchain-community \
        qdrant-client neo4j openai google-generativeai \
        pydantic pydantic-settings python-dotenv httpx \
        pandas pyyaml pytest
    echo "  ✅ Python base packages installed (no requirements.txt yet)"
fi

# --- Java Spring Boot ---
echo "[2/3] Setting up Spring Boot Backend..."
if [ -f backend/pom.xml ]; then
    cd backend && mvn dependency:resolve -q && cd ..
    echo "  ✅ Maven dependencies resolved"
else
    echo "  ⏭️  No pom.xml yet — skipping Maven setup"
fi

# --- Neo4j connectivity check ---
echo "[3/3] Checking database connectivity..."
sleep 5  # Wait for containers to be ready

python3 -c "
from neo4j import GraphDatabase
try:
    driver = GraphDatabase.driver('bolt://neo4j:7687', auth=('neo4j', 'neo4jpassword'))
    with driver.session() as session:
        result = session.run('RETURN 1 AS ping')
        print('  ✅ Neo4j: Connected')
    driver.close()
except Exception as e:
    print(f'  ⚠️  Neo4j: Not ready yet ({e}). Start manually later.')
" 2>/dev/null || echo "  ⚠️  Neo4j check skipped (driver not installed yet)"

python3 -c "
import urllib.request
try:
    resp = urllib.request.urlopen('http://qdrant:6333/healthz')
    print('  ✅ Qdrant: Connected')
except Exception as e:
    print(f'  ⚠️  Qdrant: Not ready yet ({e})')
" 2>/dev/null || echo "  ⚠️  Qdrant check skipped"

echo ""
echo "=========================================="
echo "  ✅ Dev environment ready!"
echo ""
echo "  Services:"
echo "    PostgreSQL  → postgres:5432"
echo "    Neo4j       → neo4j:7687 (browser: http://localhost:7474)"
echo "    Qdrant      → qdrant:6333"
echo ""
echo "  Next steps:"
echo "    1. cd backend   → mvn spring-boot:run"
echo "    2. cd ai-service → uvicorn app.main:app --reload"
echo "=========================================="
