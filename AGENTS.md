# AGENTS.md

Documentation for implementing AI agents and bot players in the Vetrolisci multiplayer card game.

## Overview

Vetrolisci supports AI agent integration through a flexible architecture that allows for bot players to participate in games alongside human players. This document outlines the agent system design, implementation patterns, and testing strategies.

## 🎯 Agent Architecture

### Core Agent Interface

AI agents communicate with the Vetrolisci game server through the same Socket.IO events as human players, ensuring consistent game logic and real-time synchronization.

#### Agent Base Class Structure

```javascript
class VetrolisciAgent {
  constructor(playerId, gameState) {
    this.playerId = playerId;
    this.gameState = gameState;
    this.isActive = true;
    this.thinking = false;
  }

  // Required interface methods
  async makeDraftChoice(availableCards) {
    // Implement card selection logic
    return selectedCardIndex;
  }

  async makePlacementChoice(placementScenario) {
    // Implement placement decision logic
    return placementChoice;
  }

  async handleDuplicateChoice(cards) {
    // Decide which card to keep face-up
    return choice; // 'existing' or 'new'
  }

  async handleValidatedPlacement(emptySpaces) {
    // Choose empty space for face-down placement
    return spaceIndex;
  }

  // Game state update handler
  updateGameState(newState) {
    this.gameState = newState;
  }
}
```

## 🤖 Agent Types

### 1. Simple Heuristic Agent

Implements basic game strategy using rule-based decision making:

```javascript
class HeuristicAgent extends VetrolisciAgent {
  async makeDraftChoice(availableCards) {
    // Prioritize high-value cards and special symbols
    const scoredCards = availableCards.map((card, index) => ({
      index,
      score: this.calculateCardScore(card),
    }));

    return scoredCards.sort((a, b) => b.score - a.score)[0].index;
  }

  calculateCardScore(card) {
    let score = card.value;

    // Bonus for special symbols
    if (card.symbol === "spiral") score += 2;
    if (card.symbol === "cross") score -= 1;

    // Bonus for cards that fill gaps in player's hand
    if (this.hasGapsInRange(card.value)) score += 1;

    return score;
  }
}
```

### 2. Strategic Agent

Uses more sophisticated strategy including:

- **Zone Control**: Optimizing color group formations
- **Future Planning**: Anticipating opponent moves
- **Risk Assessment**: Evaluating placement consequences

```javascript
class StrategicAgent extends VetrolisciAgent {
  async makeDraftChoice(availableCards) {
    const evaluatedCards = availableCards.map((card) => ({
      card,
      score: this.evaluateCardStrategicValue(card),
    }));

    // Use minimax or expectiminimax for decision
    return this.selectBestMove(evaluatedCards);
  }

  evaluateCardStrategicValue(card) {
    return {
      immediate: this.calculateImmediateValue(card),
      potential: this.calculatePlacementPotential(card),
      opponentDisruption: this.calculateOpponentDisruption(card),
    };
  }
}
```

### 3. Learning Agent

Implements machine learning for adaptive gameplay:

```javascript
class LearningAgent extends VetrolisciAgent {
  constructor(playerId, modelPath) {
    super(playerId);
    this.model = this.loadModel(modelPath);
    this.experienceBuffer = [];
    this.learningRate = 0.1;
  }

  async makeDraftChoice(availableCards) {
    const gameFeatures = this.extractGameFeatures();
    const predictions = availableCards.map((card) => this.model.predict({ card, gameFeatures }));

    return this.selectAction(predictions);
  }

  // Store game outcomes for training
  recordExperience(state, action, reward) {
    this.experienceBuffer.push({ state, action, reward });

    if (this.experienceBuffer.length >= BATCH_SIZE) {
      this.trainModel();
    }
  }
}
```

## 🎮 Agent Integration

### Socket.IO Event Handling

Agents must handle the same events as human players:

```javascript
class AgentSocketHandler {
  constructor(agent) {
    this.agent = agent;
    this.setupEventHandlers();
  }

  setupEventHandlers() {
    // Draft phase events
    socket.on("vetrolisci-draft-start", (data) => {
      this.agent.updateGameState(data.gameState);
    });

    socket.on("vetrolisci-draft-choice", async (data) => {
      const choice = await this.agent.makeDraftChoice(data.availableCards);
      socket.emit("vetrolisci-pick-card", { cardIndex: choice });
    });

    // Placement events
    socket.on("vetrolisci-placement-required", async (data) => {
      const choice = await this.agent.makePlacementChoice(data.scenario);
      socket.emit("vetrolisci-placement-choice", choice);
    });

    // Choice modal events
    socket.on("vetrolisci-duplicate-choice", async (data) => {
      const choice = await this.agent.handleDuplicateChoice(data.cards);
      socket.emit("vetrolisci-duplicate-decision", { choice });
    });

    socket.on("vetrolisci-validated-placement", async (data) => {
      const choice = await this.agent.handleValidatedPlacement(data.emptySpaces);
      socket.emit("vetrolisci-placement-position", { position: choice });
    });
  }
}
```

### Agent Lifecycle Management

```javascript
class AgentManager {
  constructor() {
    this.activeAgents = new Map();
    this.agentConfigs = new Map();
  }

  // Create and register a new agent
  createAgent(playerId, agentType, config = {}) {
    const agent = this.instantiateAgent(agentType, config);
    this.activeAgents.set(playerId, agent);
    this.agentConfigs.set(playerId, config);

    return agent;
  }

  // Update all agents with new game state
  updateAllAgents(gameState) {
    this.activeAgents.forEach((agent) => {
      agent.updateGameState(gameState);
    });
  }

  // Remove agent when player disconnects
  removeAgent(playerId) {
    const agent = this.activeAgents.get(playerId);
    if (agent) {
      agent.cleanup();
      this.activeAgents.delete(playerId);
      this.agentConfigs.delete(playerId);
    }
  }
}
```

## 🧪 Testing & Validation

### Bot vs Bot Testing

Run tournaments to evaluate agent performance:

```javascript
class AgentTournament {
  constructor(agents, rounds = 100) {
    this.agents = agents;
    this.rounds = rounds;
    this.results = new Map();
  }

  async runTournament() {
    for (let i = 0; i < this.rounds; i++) {
      for (let j = 0; j < this.agents.length - 1; j++) {
        for (let k = j + 1; k < this.agents.length; k++) {
          const result = await this.matchAgents(this.agents[j], this.agents[k]);
          this.recordResult(this.agents[j], this.agents[k], result);
        }
      }
    }

    return this.generateReport();
  }

  async matchAgents(agent1, agent2) {
    const roomId = `tournament-${Date.now()}-${Math.random()}`;

    // Setup game room
    // Configure both agents
    // Run game to completion
    // Return match results
  }
}
```

### Performance Metrics

Track key performance indicators:

```javascript
class AgentMetrics {
  constructor() {
    this.metrics = {
      winRate: new Map(),
      averageScore: new Map(),
      decisionTime: new Map(),
      placementsEfficiency: new Map(),
    };
  }

  recordDecision(playerId, decisionType, timeMs, quality = null) {
    const metrics = this.metrics;

    // Track decision speed
    if (!metrics.decisionTime.has(playerId)) {
      metrics.decisionTime.set(playerId, []);
    }
    metrics.decisionTime.get(playerId).push({
      type: decisionType,
      time: timeMs,
    });

    // Track placement quality if available
    if (quality) {
      this.recordQuality(playerId, decisionType, quality);
    }
  }

  generateReport() {
    return {
      winRates: this.calculateWinRates(),
      averageScores: this.calculateAverageScores(),
      decisionSpeed: this.calculateDecisionSpeed(),
      efficiency: this.calculateEfficiency(),
    };
  }
}
```

## 🔧 Configuration

### Agent Configuration Schema

```javascript
const AGENT_CONFIGS = {
  difficulty: "easy" | "medium" | "hard",
  thinkingTime: {
    draft: 1000, // ms
    placement: 500, // ms
    choice: 300, // ms
  },
  strategy: {
    aggressive: 0.7, // prefer high-value cards
    defensive: 0.3, // block opponent
    balanced: 0.5,
  },
  learning: {
    enabled: false,
    modelPath: "./models/default.pkl",
    updateFrequency: 10,
  },
  behavior: {
    simulateTyping: true, // Add artificial delays
    makeMistakes: 0.05, // Probability of suboptimal moves
    chatMessages: false, // Enable bot chat
  },
};
```

### Environment Variables

Configure agent behavior through environment variables:

```bash
# Enable AI agents in development
VETROLISCI_ENABLE_AGENTS=true

# Default agent type for testing
VETROLISCI_DEFAULT_AGENT=heuristic

# Tournament mode
VETROLISCI_TOURNAMENT_MODE=false

# Agent decision timeouts (ms)
VETROLISCI_AGENT_TIMEOUT=5000
```

## 🎯 Strategy Patterns

### Draft Phase Strategies

```javascript
const DRAFT_STRATEGIES = {
  // High-value first
  valueMaximizer: (cards) => {
    return cards.sort((a, b) => b.value - a.value)[0];
  },

  // Color control
  colorGrouper: (cards, playerState) => {
    const colorCounts = this.getPlayerColorCounts(playerState);
    return cards.find((card) => colorCounts[card.color] < 3 && card.value > 6) || cards[0];
  },

  // Disrupt opponent
  opponentDisruptor: (cards, gameState) => {
    const opponentState = gameState.players[1 - this.playerId];
    return cards.find((card) => !opponentState.hasValidatedNumber(card.value)) || cards[0];
  },
};
```

### Placement Strategies

```javascript
const PLACEMENT_STRATEGIES = {
  // Maximize validated points
  validateMax: (card, grid) => {
    const placements = this.getValidPlacements(card, grid);
    return placements.find((p) => this.validatesMaxValue(p)) || placements[0];
  },

  // Build color zones
  zoneBuilder: (card, grid, playerState) => {
    const placements = this.getValidPlacements(card, grid);
    return placements.find((p) => this.createsLargestZone(p, card.color, grid)) || placements[0];
  },
};
```

## 🚀 Deployment

### Production Agent Deployment

```javascript
// Server-side agent manager
const agentManager = new AgentManager({
  maxConcurrentAgents: 10,
  decisionTimeout: 30000,
  resourceLimits: {
    memory: "128MB",
    cpu: "25%",
  },
});

// Register agent types
agentManager.registerAgentType("heuristic", HeuristicAgent);
agentManager.registerAgentType("strategic", StrategicAgent);
agentManager.registerAgentType("learning", LearningAgent);

// Start agent server
agentManager.start();
```

### Docker Support

```dockerfile
FROM node:18-alpine

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
EXPOSE 8001

# Run with agent support
CMD ["npm", "run", "server"]
```

## 📊 Analytics & Monitoring

### Agent Performance Dashboard

Track agent performance in real-time:

```javascript
class AgentAnalytics {
  constructor() {
    this.metrics = {
      gamesPlayed: 0,
      agentsActive: 0,
      averageDecisionTime: 0,
      errorRate: 0,
    };
  }

  trackAgentEvent(playerId, event, data) {
    // Log agent decisions and outcomes
    console.log(`Agent ${playerId}: ${event}`, data);

    // Update real-time metrics
    this.updateMetrics(event, data);
  }

  generateDashboardData() {
    return {
      activeAgents: this.getActiveAgentCount(),
      performance: this.getPerformanceMetrics(),
      recentGames: this.getRecentGameStats(),
      systemHealth: this.getSystemHealth(),
    };
  }
}
```

## 🔒 Security Considerations

### Agent Validation

Ensure agents follow game rules:

```javascript
class AgentValidator {
  static validateDecision(agent, decision, gameState) {
    // Verify decision is legal
    if (!this.isLegalMove(decision, gameState)) {
      throw new Error(`Illegal move by agent ${agent.id}`);
    }

    // Check decision timing
    if (decision.responseTime > AGENT_TIMEOUT) {
      this.flagAgent(agent, "slow_response");
    }

    // Validate decision quality
    if (this.isSuspiciousPattern(agent, decision)) {
      this.flagAgent(agent, "suspicious_behavior");
    }
  }
}
```

### Rate Limiting

Prevent agent spam:

```javascript
class AgentRateLimiter {
  constructor() {
    this.limits = {
      decisionsPerMinute: 60,
      gamesPerHour: 10,
      maxConcurrentGames: 3,
    };
  }

  canMakeDecision(agentId) {
    const agent = this.getAgent(agentId);
    return this.checkLimits(agent);
  }
}
```

## 📝 Best Practices

### Development Guidelines

1. **Modular Design**: Keep agent logic separate from game logic
2. **Event-Driven**: Use Socket.IO events for all agent communication
3. **Error Handling**: Implement robust error handling for agent failures
4. **Testing**: Always test agents against human players and other agents
5. **Performance**: Monitor agent decision times and resource usage
6. **Fairness**: Ensure agents don't have unfair advantages

### Code Examples

This repository currently does not include a dedicated `src/agents/` implementation. For the closest practical reference points (server events + client Socket.IO integration), see:

- **Socket client wrapper**: `src/shared/utils/socket-client.js`
- **Room + Socket.IO server**: `src/server/main.js`
- **Game state + rules orchestration**: `src/server/vetrolisci-server.js`
- **Core rules (draft/placement/scoring/validation)**: `src/core/`

## 🆘 Troubleshooting

### Common Issues

1. **Agent Not Responding**: Check Socket.IO connection and event handlers
2. **Slow Decisions**: Optimize algorithm or increase timeout values
3. **Memory Leaks**: Ensure proper cleanup of agent instances
4. **Synchronization Issues**: Verify game state updates are atomic

### Debug Commands

```bash
# Run the app (server + client)
npm run dev

# Run server only
npm run server

# Run client only
npm run client

# Lint + basic pre-merge checks
npm run lint
npm run premerge
```

## 📚 Additional Resources

- [Game Rules Documentation](docs/vetrolisci-ruleset.md)
- [Frontend Development Guide](docs/frontend-guide.md)
- [Server entrypoint and handlers](src/server/)

---

**Note**: This agent system is designed for testing, demonstration, and single-player practice modes. For competitive multiplayer, human vs human gameplay is recommended to ensure fair competition.
