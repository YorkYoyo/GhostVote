"use client";

import { useEffect, useMemo, useState } from "react";
import { ethers } from "ethers";
import { useFhevm } from "@/fhevm/useFhevm";
import { GhostVoteABI } from "@/abi/GhostVoteABI";
import { GhostVoteAddresses } from "@/abi/GhostVoteAddresses";
import { FhevmDecryptionSignature } from "@/fhevm/FhevmDecryptionSignature";

const categories = [
  { id: "best-photography", name: "🔬 科技创新", icon: "🔬", desc: "技术突破与产品创新" },
  { id: "best-digital", name: "🌍 社会公益", icon: "🌍", desc: "环保教育与公益项目" },
  { id: "best-abstract", name: "🎨 创意设计", icon: "🎨", desc: "设计方案与艺术创作" },
  { id: "best-contemporary", name: "💼 商业模式", icon: "💼", desc: "创业项目与商业计划" },
];

export default function RankPage() {
  const [provider, setProvider] = useState<ethers.Eip1193Provider | undefined>(undefined);
  const [chainId, setChainId] = useState<number | undefined>(undefined);
  const [category, setCategory] = useState("best-photography");
  const [rows, setRows] = useState<{ id: number; title: string; handle: string; clear?: bigint | string; author: string }[]>([]);
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [decrypting, setDecrypting] = useState(false);

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

  const { instance, status } = useFhevm({ provider, chainId, initialMockChains: { 31337: "http://localhost:8545" }, enabled: true });
  const addr = useMemo(() => (chainId ? (GhostVoteAddresses as any)[chainId.toString()]?.address : undefined), [chainId]);

  const refresh = async () => {
    if (!provider || !addr) return;
    setLoading(true);
    setMsg("");
    try {
      const bp = new ethers.BrowserProvider(provider);
      const rp = await bp;
      const contract = new ethers.Contract(addr, GhostVoteABI.abi, rp);
      const ids: bigint[] = await contract.listPieces();
      const arr: { id: number; title: string; handle: string; author: string }[] = [];
      
      for (const idb of ids) {
        const id = Number(idb);
        const piece = await contract.fetchPiece(id);
        const groups = piece[6]; // groups 字段
        
        // 只有作品属于当前选择的类别才显示
        const belongsToCategory = groups.includes(category);
        if (belongsToCategory) {
          const handle = await contract.ballotBoxOf(id, category);
          arr.push({ 
            id, 
            title: piece[2], 
            handle, 
            author: piece[1],
          });
        }
      }
      setRows(arr);
      
      if (arr.length === 0) {
        setMsg(`📭 当前分类 "${getCategoryName(category)}" 下暂无提案`);
      }
    } catch (e: any) {
      setMsg("❌ " + (e?.message ?? String(e)));
    } finally {
      setLoading(false);
    }
  };

  const getCategoryName = (catId: string) => {
    const cat = categories.find(c => c.id === catId);
    return cat ? cat.name : catId;
  };

  const decryptAll = async () => {
    if (!provider || !addr || !instance || rows.length === 0) return;
    setDecrypting(true);
    setMsg("");
    try {
      const bp = new ethers.BrowserProvider(provider);
      const s = await bp.getSigner();
      const { publicKey, privateKey } = instance.generateKeypair();
      const sig = await FhevmDecryptionSignature.new(instance, [addr], publicKey, privateKey, s);
      if (!sig) throw new Error("解密签名失败");
      
      // 过滤掉空的 handle（0x0000...）
      const validPairs = rows
        .filter((r) => r.handle && r.handle !== "0x0000000000000000000000000000000000000000000000000000000000000000")
        .map((r) => ({ handle: r.handle, contractAddress: addr! }));
      
      if (validPairs.length === 0) {
        setMsg("📭 当前分类下没有投票数据可解密");
        return;
      }
      
      const res = await instance.userDecrypt(validPairs, sig.privateKey, sig.publicKey, sig.signature, sig.contractAddresses, sig.userAddress, sig.startTimestamp, sig.durationDays);
      
      setRows((old) => old.map((r) => ({
        ...r, 
        clear: r.handle && r.handle !== "0x0000000000000000000000000000000000000000000000000000000000000000" 
          ? res[r.handle] as any 
          : 0
      })));
      
      setMsg(`✅ 解密完成，共解密 ${validPairs.length} 个有效投票数据`);
    } catch (e: any) { 
      setMsg("❌ 解密失败: " + (e?.message ?? String(e))); 
    } finally {
      setDecrypting(false);
    }
  };

  useEffect(() => { refresh(); }, [provider, addr, category]);

  const sorted = [...rows].sort((a, b) => Number(b.clear ?? 0) - Number(a.clear ?? 0));
  const currentCategory = categories.find(c => c.id === category) || categories[0];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center py-12">
        <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-full mx-auto mb-6 flex items-center justify-center shadow-2xl animate-bounce-gentle">
          <span className="text-3xl">🏆</span>
        </div>
        <h1 className="text-4xl font-bold heading-gradient mb-4">创意提案排行榜</h1>
        <p className="text-soft text-xl">发现最受支持的创新项目与创意提案</p>
        <div className="mt-6 inline-flex items-center space-x-2 px-4 py-2 bg-white/60 rounded-full">
          <span className="text-sm text-gray-600">FHEVM 状态:</span>
          <span className={`px-3 py-1 rounded-full text-xs font-bold ${status === 'ready' ? 'bg-green-500 text-white' : 'bg-yellow-500 text-white'}`}>
            {status}
          </span>
        </div>
      </div>

      {/* Category Selection */}
      <div className="proposal-card">
        <h3 className="text-xl font-bold text-gray-800 mb-6">🎯 选择分类</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setCategory(cat.id)}
              className={`p-6 rounded-2xl border-2 transition-all duration-300 text-left ${
                category === cat.id
                  ? 'border-indigo-400 bg-indigo-50 shadow-lg scale-105'
                  : 'border-gray-200 bg-white hover:border-indigo-200 hover:bg-indigo-25'
              }`}
            >
              <div className="text-3xl mb-3">{cat.icon}</div>
              <h4 className="font-bold text-lg text-gray-800 mb-2">{cat.name.replace(/🔬|🌍|🎨|💼/, '').trim()}</h4>
              <p className="text-sm text-gray-600">{cat.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap gap-4">
        <button
          onClick={refresh}
          disabled={loading}
          className="btn-primary"
        >
          {loading ? (
            <>
              <span className="inline-block animate-spin mr-2">🔄</span>
              加载中...
            </>
          ) : (
            "🔄 刷新排行"
          )}
        </button>
        
        <button
          onClick={decryptAll}
          disabled={decrypting || rows.length === 0}
          className="btn-secondary"
        >
          {decrypting ? (
            <>
              <span className="inline-block animate-spin mr-2">🔓</span>
              解密中...
            </>
          ) : (
            "🔓 解密所有投票数"
          )}
        </button>
      </div>

      {/* Message */}
      {msg && (
        <div className={`proposal-card border-2 ${
          msg.includes('✅') 
            ? 'border-green-200 bg-green-50' 
            : 'border-red-200 bg-red-50'
        }`}>
          <p className="font-semibold text-lg">{msg}</p>
        </div>
      )}

      {/* Rankings */}
      <div className="proposal-card">
        <div className="flex items-center space-x-4 mb-8">
          <span className="text-4xl">{currentCategory.icon}</span>
          <div>
            <h2 className="text-2xl font-bold heading-gradient">{currentCategory.name}</h2>
            <p className="text-soft">{currentCategory.desc}</p>
          </div>
        </div>

        {sorted.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-6xl mb-6">🏆</div>
            <h3 className="text-2xl font-bold heading-gradient mb-4">暂无排行数据</h3>
            <p className="text-soft text-lg">还没有提案获得投票，快去支持你认为有潜力的创意吧！</p>
          </div>
        ) : (
          <div className="space-y-4">
            {sorted.map((item, index) => (
              <div
                key={item.id}
                className={`flex items-center gap-6 p-6 rounded-2xl transition-all duration-300 ${
                  index < 3 
                    ? 'bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 border-2 border-indigo-200 shadow-lg' 
                    : 'bg-white border-2 border-gray-100'
                } hover:scale-[1.02] hover:shadow-xl`}
              >
                {/* Rank */}
                <div className={`flex-shrink-0 w-16 h-16 rounded-full flex items-center justify-center font-bold text-2xl ${
                  index === 0 ? 'bg-gradient-to-br from-yellow-400 to-orange-500 text-white shadow-lg' :
                  index === 1 ? 'bg-gradient-to-br from-gray-300 to-gray-500 text-white shadow-lg' :
                  index === 2 ? 'bg-gradient-to-br from-orange-300 to-red-400 text-white shadow-lg' :
                  'bg-gradient-to-br from-indigo-100 to-purple-100 text-indigo-700'
                }`}>
                  {index < 3 ? ['🥇', '🥈', '🥉'][index] : index + 1}
                </div>

                {/* Proposal Info */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-xl text-gray-800 mb-1">#{item.id} {item.title}</h3>
                  <p className="text-soft">
                    提案人: <span className="code text-sm">{item.author.slice(0, 6)}...{item.author.slice(-4)}</span>
                  </p>
                </div>

                {/* Vote Count */}
                <div className="flex-shrink-0 text-right">
                  <div className={`text-3xl font-bold mb-1 ${
                    item.clear !== undefined ? 'heading-gradient' : 'text-gray-400'
                  }`}>
                    {item.clear !== undefined ? String(item.clear) : '?'}
                  </div>
                  <div className="text-sm text-gray-500">投票数</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}