import React,{useState,useEffect,useCallback} from 'react';
import {View,Text,FlatList,TouchableOpacity,StyleSheet,TextInput,RefreshControl,ScrollView} from 'react-native';
import ScreenHeader from '../../components/ScreenHeader';
import Badge from '../../components/Badge';
import EmptyState from '../../components/EmptyState';
import {useTheme} from '../../context/ThemeContext';
import {invoiceAPI} from '../../utils/api';
import {formatCurrency,formatDate} from '../../utils/format';
import {SPACING,RADIUS,SHADOW} from '../../utils/theme';
import { Feather } from '@expo/vector-icons';

const TABS=['all','paid','pending','partial','overdue'];

export default function InvoiceListScreen({navigation}){
  const {theme}=useTheme();
  const [invoices,setInvoices]=useState([]);
  const [loading,setLoading]=useState(true);
  const [refreshing,setRefreshing]=useState(false);
  const [search,setSearch]=useState('');
  const [tab,setTab]=useState('all');

  const fetch=useCallback(async()=>{
    try{const res=await invoiceAPI.getAll();setInvoices(res.data||[]);}
    catch(e){console.error(e);}
    finally{setLoading(false);setRefreshing(false);}
  },[]);

  useEffect(()=>{fetch();},[fetch]);

  const filtered=invoices.filter(inv=>{
    const name=(inv.customer?.name||inv.customerName||'').toLowerCase();
    const num=(inv.invoiceNumber||inv._id||'').toLowerCase();
    return (name.includes(search.toLowerCase())||num.includes(search.toLowerCase()))&&(tab==='all'||inv.status===tab);
  });

  const total=filtered.reduce((s,i)=>s+(i.grandTotal||i.amount||0),0);
  const collected=filtered.reduce((s,i)=>s+(i.amountPaid||i.paid||0),0);

  return(
    <View style={[styles.container,{backgroundColor:theme.bgBase}]}>
      <ScreenHeader title="Invoices" subtitle={`${filtered.length} invoices`}
        action={
          <TouchableOpacity style={[styles.addBtn,{backgroundColor:theme.accent},SHADOW.sm]} onPress={()=>navigation.navigate('CreateInvoice')}>
            <Feather name="plus" size={16} color="#fff" />
            <Text style={styles.addBtnText}>New</Text>
          </TouchableOpacity>
        }/>

      <View style={[styles.strip,{backgroundColor:theme.bgSurface,borderBottomColor:theme.border}]}>
        <View style={styles.si}>
          <Text style={[styles.sv,{color:theme.textPrimary}]}>{formatCurrency(total)}</Text>
          <Text style={[styles.sl,{color:theme.textSecondary}]}>Total</Text>
        </View>
        <View style={[styles.div,{backgroundColor:theme.border}]}/>
        <View style={styles.si}>
          <Text style={[styles.sv,{color:theme.green}]}>{formatCurrency(collected)}</Text>
          <Text style={[styles.sl,{color:theme.textSecondary}]}>Collected</Text>
        </View>
        <View style={[styles.div,{backgroundColor:theme.border}]}/>
        <View style={styles.si}>
          <Text style={[styles.sv,{color:theme.amber}]}>{formatCurrency(total-collected)}</Text>
          <Text style={[styles.sl,{color:theme.textSecondary}]}>Outstanding</Text>
        </View>
      </View>

      <View style={{padding:SPACING.md,paddingBottom:0,gap:SPACING.sm}}>
        <TextInput 
          style={[styles.search,{backgroundColor:theme.bgCard,borderColor:theme.border,color:theme.textPrimary}]} 
          placeholder="Search invoices…" 
          placeholderTextColor={theme.textMuted} 
          value={search} 
          onChangeText={setSearch}
        />

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabsScroll} contentContainerStyle={styles.tabsRow}>
          {TABS.map(t=>(
            <TouchableOpacity key={t} style={[styles.tab,tab===t?{backgroundColor:theme.accent,borderColor:theme.accent}:{backgroundColor:theme.bgCard,borderColor:theme.border}]} onPress={()=>setTab(t)}>
              <Text style={[styles.tabText,{color:theme.textSecondary},tab===t&&{color:'#fff'}]}>{t.charAt(0).toUpperCase()+t.slice(1)}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <FlatList data={filtered} keyExtractor={i=>i._id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={()=>{setRefreshing(true);fetch();}} tintColor={theme.accent}/>}
        renderItem={({item:inv})=>(
          <TouchableOpacity style={[styles.row,{backgroundColor:theme.bgCard}]} activeOpacity={0.7}
            onPress={()=>navigation.navigate('InvoiceDetail',{id:inv._id||inv.id,invoice:inv})}>
            <View style={styles.rowLeft}>
              <Text style={[styles.invNum,{color:theme.accent}]}>{inv.invoiceNumber||inv._id}</Text>
              <Text style={[styles.custName,{color:theme.textPrimary}]}>{inv.customer?.name||inv.customerName||'—'}</Text>
              <Text style={[styles.date,{color:theme.textMuted}]}>{formatDate(inv.createdAt||inv.date)}</Text>
            </View>
            <View style={styles.rowRight}>
              <Text style={[styles.amount,{color:theme.textPrimary}]}>{formatCurrency(inv.grandTotal||inv.amount||0)}</Text>
              <Badge status={inv.status||'draft'}/>
            </View>
          </TouchableOpacity>
        )}
        ItemSeparatorComponent={()=><View style={[styles.sep,{backgroundColor:theme.border}]}/>}
        ListEmptyComponent={loading?<Text style={[styles.loadText,{color:theme.textMuted}]}>Loading…</Text>
          :<EmptyState icon="🧾" title={invoices.length===0?'No invoices yet':'No invoices match'} subtitle={invoices.length===0?'Tap + New to create your first invoice':''}/>}
        contentContainerStyle={filtered.length===0?{flex:1}:{paddingBottom:80}}
      />
    </View>
  );
}
const styles=StyleSheet.create({
  container:{flex:1,paddingTop:25},
  addBtn:{borderRadius:RADIUS.md,paddingHorizontal:12,paddingVertical:8,flexDirection:'row',alignItems:'center',gap:4,elevation:2},
  addBtnText:{color:'#fff',fontSize:13,fontWeight:'700'},
  strip:{flexDirection:'row',borderBottomWidth:1,paddingVertical:SPACING.md},
  si:{flex:1,alignItems:'center'},
  sv:{fontSize:20,fontWeight:'700'},
  sl:{fontSize:12,marginTop:4},
  div:{width:1,marginVertical:4},
  search:{borderWidth:1,borderRadius:RADIUS.md,paddingHorizontal:SPACING.md,paddingVertical:12,fontSize:15},
  tabsScroll:{maxHeight:60},
  tabsRow:{paddingVertical:SPACING.md,gap:8,flexDirection:'row'},
  tab:{paddingHorizontal:18,paddingVertical:2,borderRadius:RADIUS.full,borderWidth:1},
  tabText:{fontSize:13,fontWeight:'600'},
  row:{padding:SPACING.md,flexDirection:'row',gap:SPACING.sm,marginHorizontal:SPACING.md,marginTop:SPACING.md,borderRadius:RADIUS.lg,borderWidth:1,borderColor:'transparent'},
  rowLeft:{flex:1,gap:4},
  rowRight:{alignItems:'flex-end',gap:6},
  invNum:{fontSize:15,fontWeight:'700'},
  custName:{fontSize:16,fontWeight:'600'},
  date:{fontSize:13},
  amount:{fontSize:17,fontWeight:'700'},
  sep:{height:0},
  loadText:{textAlign:'center',padding:SPACING.xl,fontSize:14},
});
