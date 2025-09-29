"use client";

import { useEffect, useMemo, useState } from "react";
import { ethers } from "ethers";
import { useFhevm } from "@/fhevm/useFhevm";
import { GhostVoteABI } from "@/abi/GhostVoteABI";
import { GhostVoteAddresses } from "@/abi/GhostVoteAddresses";

export default function UploadPage() {
  const [provider, setProvider] = useState<ethers.Eip1193Provider | undefined>(undefined);
  const [chainId, setChainId] = useState<number | undefined>(undefined);
  const [title, setTitle] = useState("");
  const [descHash, setDescHash] = useState("");
  const [fileHash, setFileHash] = useState("");
  const [tags, setTags] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [msg, setMsg] = useState("");
  const [uploading, setUploading] = useState(false);

  const categories = [
    { id: "best-photography", name: "科技创新", icon: "🔬", desc: "技术突破、产品创新、科研项目" },
    { id: "best-digital", name: "社会公益", icon: "🌍", desc: "环保、教育、公益慈善项目" },
    { id: "best-abstract", name: "创意设计", icon: "🎨", desc: "设计方案、艺术创作、品牌策划" },
    { id: "best-contemporary", name: "商业模式", icon: "💼", desc: "创业项目、商业计划、市场方案" },
  ];

  useEffect(() => {
    const detectProvider = () => {
      if (typeof window !== "undefined" && (window as any).ethereum) {
        const eth = (window as any).ethereum as ethers.Eip1193Provider;
        setProvider(eth);
        eth.request({ method: "eth_chainId" }).then((cid) => setChainId(parseInt(cid as string, 16)));
        return true;
      }
      return false;
    };

    if (!detectProvider()) {
      const timer = setInterval(() => {
        if (detectProvider()) clearInterval(timer);
      }, 100);
      setTimeout(() => clearInterval(timer), 5000);
    }
  }, []);

  const { status } = useFhevm({ provider, chainId, initialMockChains: { 31337: "http://localhost:8545" }, enabled: true });
  const addr = useMemo(() => (chainId ? (GhostVoteAddresses as any)[chainId.toString()]?.address : undefined), [chainId]);

  const onSubmit = async () => {
    if (!provider || !addr || !title.trim() || selectedCategories.length === 0) return;
    
    setUploading(true);
    setMsg("");
    
    try {
      const bp = new ethers.BrowserProvider(provider);
      const s = await bp.getSigner();
      const contract = new ethers.Contract(addr, GhostVoteABI.abi, s);
      const tagArr = tags.trim() ? tags.split(",").map((t) => t.trim()) : [];
      
      setMsg("🚀 正在提交到区块链...");
      const tx = await contract.registerPiece(title, descHash, fileHash, tagArr, selectedCategories);
      
      setMsg("⏳ 等待交易确认...");
      await tx.wait();
      
      setMsg("✅ 创意提案提交成功！");
      // 清空表单
      setTitle("");
      setDescHash("");
      setFileHash("");
      setTags("");
      setSelectedCategories([]);
    } catch (e: any) {
      setMsg("❌ 提交失败: " + (e?.message ?? String(e)));
    } finally {
      setUploading(false);
    }
  };

  const toggleCategory = (categoryId: string) => {
    setSelectedCategories(prev => 
      prev.includes(categoryId) 
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const fillExample = () => {
    setTitle("AI驱动的城市垃圾分类系统");
    setDescHash("ipfs://QmExampleProposalDescription123");
    setFileHash("ipfs://QmExampleProposalDocument456");
    setTags("人工智能, 环保, 智慧城市, 物联网");
    setSelectedCategories(["best-photography"]);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center py-12">
        <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-full mx-auto mb-6 flex items-center justify-center shadow-2xl animate-bounce-gentle">
          <span className="text-3xl">💡</span>
        </div>
        <h1 className="text-4xl font-bold heading-gradient mb-4">提交创意提案</h1>
        <p className="text-soft text-xl">分享你的创新想法，获得社区支持与投票</p>
        <div className="mt-6 inline-flex items-center space-x-2 px-4 py-2 bg-white/60 rounded-full">
          <span className="text-sm text-gray-600">FHEVM 状态:</span>
          <span className={`px-3 py-1 rounded-full text-xs font-bold ${status === 'ready' ? 'bg-green-500 text-white' : 'bg-yellow-500 text-white'}`}>
            {status}
          </span>
        </div>
      </div>

      <div className="proposal-card">
        <div className="space-y-8">
          {/* 提案标题 */}
          <div>
            <label className="block text-gray-800 font-bold text-lg mb-3">
              💡 创意标题 *
            </label>
            <input
              type="text"
              placeholder="用一句话概括你的创意..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="input-proposal w-full"
              disabled={uploading}
            />
            <p className="text-sm text-gray-500 mt-2">一个吸引人的标题能让更多人关注你的创意</p>
          </div>

          {/* 详细描述 */}
          <div>
            <label className="block text-gray-800 font-bold text-lg mb-3">
              📄 详细描述链接
            </label>
            <input
              type="text"
              placeholder="ipfs://QmYourDetailedDescription..."
              value={descHash}
              onChange={(e) => setDescHash(e.target.value)}
              className="input-proposal w-full"
              disabled={uploading}
            />
            <p className="text-sm text-gray-500 mt-2">
              上传详细的项目描述到 IPFS 或其他去中心化存储
            </p>
          </div>

          {/* 项目文档 */}
          <div>
            <label className="block text-gray-800 font-bold text-lg mb-3">
              📎 项目文档链接
            </label>
            <input
              type="text"
              placeholder="ipfs://QmYourProjectDocuments..."
              value={fileHash}
              onChange={(e) => setFileHash(e.target.value)}
              className="input-proposal w-full"
              disabled={uploading}
            />
            <p className="text-sm text-gray-500 mt-2">
              包含商业计划书、技术文档、设计稿等相关材料
            </p>
          </div>

          {/* 关键词标签 */}
          <div>
            <label className="block text-gray-800 font-bold text-lg mb-3">
              🏷️ 关键词标签
            </label>
            <input
              type="text"
              placeholder="人工智能, 区块链, 环保, 教育"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              className="input-proposal w-full"
              disabled={uploading}
            />
            <p className="text-sm text-gray-500 mt-2">
              用逗号分隔多个标签，帮助其他人发现你的项目
            </p>
          </div>

          {/* 项目分类 */}
          <div>
            <label className="block text-gray-800 font-bold text-lg mb-4">
              🎯 项目分类 * (可多选)
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {categories.map((cat) => (
                <div
                  key={cat.id}
                  onClick={() => toggleCategory(cat.id)}
                  className={`p-6 rounded-2xl border-2 cursor-pointer transition-all duration-300 ${
                    selectedCategories.includes(cat.id)
                      ? 'border-indigo-400 bg-indigo-50 shadow-lg scale-105'
                      : 'border-gray-200 bg-white hover:border-indigo-200 hover:bg-indigo-25'
                  } ${uploading ? 'pointer-events-none opacity-50' : ''}`}
                >
                  <div className="flex items-start space-x-4">
                    <div className="text-3xl">{cat.icon}</div>
                    <div className="flex-1">
                      <h3 className="font-bold text-lg text-gray-800 mb-2">{cat.name}</h3>
                      <p className="text-sm text-gray-600">{cat.desc}</p>
                      {selectedCategories.includes(cat.id) && (
                        <div className="mt-3 flex items-center text-indigo-600">
                          <span className="text-lg">✓</span>
                          <span className="ml-2 font-semibold">已选择</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <p className="text-sm text-gray-500 mt-4">
              选择最符合你项目特点的分类，将参与对应的排行榜竞争
            </p>
          </div>

          {/* 提交按钮 */}
          <div className="flex gap-4 pt-6">
            <button
              onClick={onSubmit}
              disabled={!title.trim() || selectedCategories.length === 0 || uploading || status !== 'ready'}
              className="btn-primary flex-1"
            >
              {uploading ? (
                <>
                  <span className="inline-block animate-spin mr-2">⚡</span>
                  提交中...
                </>
              ) : (
                "🚀 提交创意提案"
              )}
            </button>
            <button
              onClick={fillExample}
              disabled={uploading}
              className="btn-secondary"
            >
              📝 填入示例
            </button>
          </div>

          {/* 消息显示 */}
          {msg && (
            <div className={`p-6 rounded-2xl border-2 ${
              msg.includes('✅') 
                ? 'bg-green-50 border-green-200 text-green-800' 
                : msg.includes('❌')
                ? 'bg-red-50 border-red-200 text-red-800'
                : 'bg-blue-50 border-blue-200 text-blue-800'
            }`}>
              <p className="font-semibold text-lg">{msg}</p>
            </div>
          )}
        </div>
      </div>

      {/* 使用提示 */}
      <div className="proposal-card bg-gradient-to-r from-indigo-50 to-purple-50">
        <h3 className="text-xl font-bold heading-gradient mb-6">💡 提案指南</h3>
        <div className="space-y-4 text-gray-700">
          <div className="flex items-start space-x-3">
            <span className="text-indigo-500 text-xl">🎯</span>
            <p><strong>明确目标:</strong> 清楚描述你的创意要解决什么问题</p>
          </div>
          <div className="flex items-start space-x-3">
            <span className="text-purple-500 text-xl">🔒</span>
            <p><strong>隐私保护:</strong> 投票数据通过 FHEVM 同态加密保护</p>
          </div>
          <div className="flex items-start space-x-3">
            <span className="text-pink-500 text-xl">🌟</span>
            <p><strong>公平竞争:</strong> 所有提案都有平等的展示机会</p>
          </div>
          <div className="flex items-start space-x-3">
            <span className="text-indigo-500 text-xl">🚀</span>
            <p><strong>永久存储:</strong> 提案一旦提交将永久保存在区块链上</p>
          </div>
        </div>
      </div>
    </div>
  );
}