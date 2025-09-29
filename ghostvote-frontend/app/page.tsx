"use client";

import { useEffect, useMemo, useState } from "react";
import { ethers } from "ethers";
import { useFhevm } from "@/fhevm/useFhevm";
import { useGallery } from "@/hooks/useGallery";

export default function Page() {
  const [provider, setProvider] = useState<ethers.Eip1193Provider | undefined>(undefined);
  const [chainId, setChainId] = useState<number | undefined>(undefined);
  const forceSepolia = process.env.NEXT_PUBLIC_FORCE_SEPOLIA === "1";
  const autoSwitchTriedRef = useState<{ tried: boolean }>({ tried: false })[0];

  useEffect(() => {
    const detectProvider = () => {
      if (typeof window !== "undefined" && (window as any).ethereum) {
        const eth = (window as any).ethereum as ethers.Eip1193Provider;
        setProvider(eth);
        eth.request({ method: "eth_chainId" }).then((cid) => {
          const chainIdNum = parseInt(cid as string, 16);
          setChainId(chainIdNum);
        });
        return true;
      }
      return false;
    };

    if (!detectProvider()) {
      const timer = setInterval(() => {
        if (detectProvider()) {
          clearInterval(timer);
        }
      }, 100);
      setTimeout(() => clearInterval(timer), 10000);
    }
  }, []);

  const { instance, status, error } = useFhevm({ provider, chainId, initialMockChains: { 31337: "http://localhost:8545" }, enabled: true });
  const gallery = useGallery({ instance, provider, chainId });

  const connect = async () => {
    if (!provider) return;
    await provider.request?.({ method: "eth_requestAccounts" });
  };

  const switchToSepolia = async () => {
    if (!provider) return;
    try {
      await provider.request?.({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: "0xaa36a7" }],
      });
    } catch (e: any) {
      if (e?.code === 4902) {
        await provider.request?.({
          method: "wallet_addEthereumChain",
          params: [{
            chainId: "0xaa36a7",
            chainName: "Sepolia",
            nativeCurrency: { name: "Sepolia ETH", symbol: "ETH", decimals: 18 },
            rpcUrls: ["https://rpc.sepolia.org"],
            blockExplorerUrls: ["https://sepolia.etherscan.io"],
          }],
        });
        await provider.request?.({ method: "wallet_switchEthereumChain", params: [{ chainId: "0xaa36a7" }] });
      }
    }
    const cid = await provider.request?.({ method: "eth_chainId" });
    if (cid) setChainId(parseInt(cid as string, 16));
  };

  useEffect(() => {
    if (!forceSepolia || !provider || chainId === undefined) return;
    if (chainId !== 11155111 && !autoSwitchTriedRef.tried) {
      autoSwitchTriedRef.tried = true;
      switchToSepolia();
    }
  }, [forceSepolia, provider, chainId]);

  const getCategoryInfo = (category: string) => {
    switch (category) {
      case 'best-photography': return { name: '科技创新', icon: '🔬', class: 'category-tech' };
      case 'best-digital': return { name: '社会公益', icon: '🌍', class: 'category-social' };
      case 'best-abstract': return { name: '创意设计', icon: '🎨', class: 'category-creative' };
      case 'best-contemporary': return { name: '商业模式', icon: '💼', class: 'category-business' };
      default: return { name: category, icon: '💡', class: 'category-tech' };
    }
  };

  const content = useMemo(() => {
    if (!provider) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <div className="proposal-card max-w-lg text-center animate-bounce-gentle">
            <div className="w-24 h-24 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-full mx-auto mb-8 flex items-center justify-center shadow-2xl">
              <span className="text-4xl">🚀</span>
            </div>
            <h2 className="text-3xl font-bold heading-gradient mb-4">连接钱包</h2>
            <p className="text-soft text-lg mb-8">连接 MetaMask 开始参与创意提案投票</p>
            <button onClick={connect} className="btn-primary w-full">
              🔗 连接 MetaMask
            </button>
          </div>
        </div>
      );
    }
    
    if (status !== "ready") {
      return (
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <div className="proposal-card text-center max-w-lg">
            <div className="relative w-20 h-20 mx-auto mb-6">
              <div className="absolute inset-0 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
              <div className="absolute inset-2 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full flex items-center justify-center">
                <span className="text-white text-xl">⚡</span>
              </div>
            </div>
            <h3 className="text-2xl font-bold heading-gradient mb-3">系统初始化中</h3>
            <p className="text-soft mb-4">正在连接 FHEVM 网络... {status}</p>
            {error && <p className="text-red-500 text-sm mb-4 p-3 bg-red-50 rounded-lg">{error.message}</p>}
            {provider && chainId !== undefined && chainId !== 11155111 && (
              <div className="mt-6 p-4 bg-yellow-50 rounded-lg">
                <p className="text-soft mb-3">当前网络: {chainId}，建议使用 Sepolia 测试网</p>
                <button onClick={switchToSepolia} className="btn-secondary">切换到 Sepolia</button>
              </div>
            )}
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-12">
        {/* Network Warning */}
        {provider && chainId !== 11155111 && (
          <div className="proposal-card border-yellow-200 bg-yellow-50/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <span className="text-2xl">⚠️</span>
                <p className="text-soft">当前网络: {chainId ?? '-'}，推荐使用 Sepolia 测试网获得最佳体验</p>
              </div>
              <button onClick={switchToSepolia} className="btn-secondary">切换网络</button>
            </div>
          </div>
        )}

        {/* Hero Section */}
        <div className="text-center py-16">
          <div className="relative">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-32 h-32 bg-gradient-to-br from-indigo-400 to-purple-400 rounded-full opacity-20 pulse-ring"></div>
            </div>
            <h1 className="relative text-6xl md:text-8xl font-extrabold heading-gradient mb-8 leading-tight">
              IdeaHub
            </h1>
          </div>
          <p className="text-2xl text-soft max-w-4xl mx-auto mb-12 leading-relaxed">
            发现并支持最具潜力的创意提案，用区块链技术保护每一票的隐私与公正
          </p>
          <div className="flex flex-wrap justify-center gap-6">
            <button 
              onClick={gallery.refreshArtworks} 
              disabled={!gallery.canRefresh || gallery.busy}
              className="btn-primary"
            >
              {gallery.busy ? "🔄 加载中..." : "🔄 刷新提案"}
            </button>
            <button 
              onClick={() => gallery.mockUpload()} 
              className="btn-secondary"
            >
              ⚡ 生成示例提案
            </button>
          </div>
        </div>

        {/* Message Display */}
        {gallery.message && (
          <div className="proposal-card border-blue-200 bg-blue-50/50">
            <div className="flex items-center space-x-3">
              <span className="text-2xl">💬</span>
              <p className="text-soft font-semibold">{gallery.message}</p>
            </div>
          </div>
        )}

        {/* Proposals Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
          {gallery.items.length === 0 ? (
            <div className="col-span-full">
              <div className="proposal-card text-center py-20">
                <div className="text-8xl mb-8">💡</div>
                <h3 className="text-3xl font-bold heading-gradient mb-4">暂无创意提案</h3>
                <p className="text-soft text-lg">成为第一个提交创意提案的用户！</p>
                <button className="btn-primary mt-6">💡 提交我的创意</button>
              </div>
            </div>
          ) : (
            gallery.items.map((item) => (
              <div key={item.id} className="proposal-card">
                {/* Proposal Header */}
                <div className="flex items-start justify-between mb-6">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-xl flex items-center justify-center">
                      <span className="text-white text-xl">💡</span>
                    </div>
                    <div>
                      <span className="status-active">进行中</span>
                      <p className="text-xs text-gray-400 mt-1 code">ID: {item.id}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-400">提案人</p>
                    <p className="code text-sm font-semibold">{item.artist.slice(0, 6)}...{item.artist.slice(-4)}</p>
                  </div>
                </div>

                {/* Proposal Content */}
                <div className="space-y-4">
                  <h3 className="text-2xl font-bold text-gray-800">{item.title}</h3>
                  
                  {/* Tags */}
                  <div className="flex flex-wrap gap-2">
                    {item.tags.map((tag, idx) => (
                      <span key={idx} className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm font-medium">
                        #{tag}
                      </span>
                    ))}
                  </div>
                  
                  {/* Categories */}
                  <div className="flex flex-wrap gap-3">
                    {item.categories.map((group, idx) => {
                      const categoryInfo = getCategoryInfo(group);
                      return (
                        <span key={idx} className={categoryInfo.class}>
                          {categoryInfo.icon} {categoryInfo.name}
                        </span>
                      );
                    })}
                  </div>

                  <div className="bg-gray-50 rounded-xl p-4">
                    <p className="text-xs text-gray-500 mb-1">提案详情</p>
                    <p className="code text-xs text-gray-600 break-all">{item.fileHash.slice(0, 40)}...</p>
                  </div>
                </div>

                {/* Action Section */}
                <div className="space-y-4 mt-8">
                  {/* Support Button */}
                  <button 
                    onClick={() => gallery.like(item.id)} 
                    disabled={!gallery.canLike || gallery.busy || gallery.likedItems.has(item.id)}
                    className={`w-full ${
                      gallery.likedItems.has(item.id) 
                        ? 'btn-success opacity-75 cursor-not-allowed' 
                        : 'btn-success hover:scale-105'
                    }`}
                  >
                    {gallery.likedItems.has(item.id) ? '✅ 已支持' : '👍 支持这个创意'}
                  </button>
                  
                  {/* Category Voting */}
                  {item.categories.length > 0 && (
                    <div className="space-y-3">
                      <p className="text-sm font-semibold text-gray-600">📊 分类投票:</p>
                      {item.categories.map((group) => {
                        const categoryInfo = getCategoryInfo(group);
                        return (
                          <button 
                            key={group}
                            onClick={() => gallery.vote(item.id, group)} 
                            disabled={!gallery.canVote || gallery.busy || gallery.votedItems.has(item.id)}
                            className={`w-full text-sm ${
                              gallery.votedItems.has(item.id) 
                                ? 'btn-secondary opacity-75 cursor-not-allowed' 
                                : 'btn-secondary hover:scale-105'
                            }`}
                          >
                            {gallery.votedItems.has(item.id) ? '✅ 已投票' : `🗳️ 投票给 "${categoryInfo.name}"`}
                          </button>
                        );
                      })}
                    </div>
                  )}
                  
                  {/* Decrypt Button */}
                  <button 
                    onClick={() => gallery.decryptLikes(item.id)} 
                    disabled={!gallery.canDecrypt || gallery.busy}
                    className="btn-secondary w-full text-sm"
                  >
                    🔓 查看支持数据
                  </button>

                  {/* Results Display */}
                  {gallery.likesClear[item.id] !== undefined && (
                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl p-4">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-green-800">💎 支持数量</span>
                        <span className="text-2xl font-bold text-green-600">{String(gallery.likesClear[item.id])}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    );
  }, [provider, status, error, gallery]);

  return content;
}