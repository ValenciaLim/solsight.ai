# Solana Analytics SaaS

A real-time AI-powered analytics platform for Solana users and enterprises, built with Next.js, Tailwind CSS, Framer Motion, and Vercel AI SDK.

## 🚀 Features

### Individual Users
- **Wallet Connection**: Connect with Phantom, Solflare, and other Solana wallets
- **AI-Powered Dashboard**: Personalized analytics based on onboarding preferences
- **NLP Commands**: Natural language interface for dashboard customization
- **Real-time Analytics**: Live portfolio tracking with mock blockchain data
- **AI Insights**: Intelligent recommendations and market analysis
- **Smart Alerts**: Customizable notifications for price changes and activity

### Enterprise Users
- **Multi-wallet Management**: Monitor multiple organizational wallets
- **Pre-built Templates**: Government, Financial, and DAO dashboard templates
- **Team Collaboration**: Role-based access and team management
- **Compliance Tools**: Regulatory compliance and audit trail features
- **Advanced Analytics**: Deep insights into treasury and operations

## 🛠 Tech Stack

- **Frontend**: Next.js 14, React 18, TypeScript
- **Styling**: Tailwind CSS, Framer Motion
- **AI/NLP**: Vercel AI SDK, OpenAI GPT-4
- **Blockchain**: Solana Web3.js, Wallet Adapter
- **Charts**: Recharts
- **Icons**: Lucide React

## 📦 Installation

1. **Clone the repository**
```bash
git clone <repository-url>
   cd solana-analytics-saas
```

2. **Install dependencies**
```bash
npm install
   # or use the provided script
   chmod +x install-deps.sh
   ./install-deps.sh
   ```

3. **Set up environment variables**
   Create a `.env.local` file in the root directory:
   ```env
   OPENAI_API_KEY=your_openai_api_key_here
   NEXT_PUBLIC_SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
   ```

4. **Run the development server**
```bash
npm run dev
```

5. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🎯 User Flows

### Individual User Flow
1. **Home Page** → "Launch Individual Dashboard"
2. **Login** → Connect Solana wallet (Phantom/Solflare)
3. **Onboarding** → Complete questionnaire or use NLP commands
4. **Dashboard** → View personalized analytics and insights
5. **AI Chat** → Use NLP sidebar for dashboard customization

### Enterprise User Flow
1. **Home Page** → "Enterprise Login"
2. **Enterprise Login** → Sign in with organization credentials
3. **Admin Panel** → Manage wallets and team access
4. **Template Selection** → Choose from pre-built dashboard templates
5. **Dashboard Creation** → Generate analytics for multiple wallets

## 🔧 Configuration

### Onboarding Questions
The platform includes structured onboarding with questions about:
- Analysis type (NFTs, DeFi, Portfolio, Public wallets)
- Wallet focus (Own, Public, Both)
- Alert frequency (Real-time, Daily, Weekly)
- Chart preferences (Line, Bar, Pie, Table)
- AI features (Suggestions, Auto-trending, Summaries)
- Time focus (Short, Medium, Long-term)

### Dashboard Templates
Pre-built templates for different organization types:
- **Government/Regulatory**: Compliance KPIs, suspicious activity monitoring
- **Financial Institution**: Portfolio aggregation, token distribution
- **DAO/Community**: NFT movement, treasury analytics

## 🤖 AI Integration

The platform uses Vercel AI SDK for:
- **NLP Commands**: Natural language dashboard creation
- **AI Insights**: Intelligent portfolio analysis
- **Smart Alerts**: AI-generated notifications
- **Chat Interface**: Collapsible sidebar for user interaction

## 📊 Data Sources

Currently uses mock data for:
- Wallet balances and transactions
- NFT holdings and floor prices
- DeFi positions and yields
- Market trends and analytics

## 🎨 Design System

- **Colors**: Solana gradient (Purple → Indigo → Cyan)
- **Animations**: Framer Motion for smooth transitions
- **Components**: Custom components with Tailwind CSS
- **Responsive**: Mobile-first design approach

## 🚀 Deployment

### Vercel (Recommended)
1. Connect your GitHub repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Other Platforms
The app can be deployed to any platform that supports Next.js:
- Netlify
- AWS Amplify
- Railway
- DigitalOcean App Platform

## 🔒 Security

- **Wallet Integration**: Secure Solana wallet connections
- **Role-based Access**: Individual vs Enterprise user permissions
- **Data Privacy**: Configurable data retention policies
- **API Security**: Secure AI API integrations

## 📈 Roadmap

- [ ] Real blockchain data integration (Helius API)
- [ ] Advanced DeFi analytics
- [ ] NFT marketplace integration
- [ ] Mobile app development
- [ ] Advanced AI agent capabilities
- [ ] Multi-chain support

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Create an issue in the GitHub repository
- Check the documentation
- Contact the development team

---

Built with ❤️ for the Solana ecosystem