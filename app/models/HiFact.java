package models;

import java.util.*;

import javax.persistence.*;

import play.db.jpa.*;

@Entity
public class HiFact extends Model implements Comparable<HiFact> {
	public String owner;
	public String item;
	public String property;
	public long timestamp;
	public long sequence;

	@Column(columnDefinition = "TEXT")
	public String value;

	public HiFact() {
	}

	public HiFact(String fact) {
		int eq = fact.indexOf("=");
		int at = fact.indexOf("@");
		String[] keyTokens = fact.substring(0, at).split("-");

		this.owner = keyTokens[0];
		this.item = keyTokens[1];
		this.property = keyTokens[2];
		this.timestamp = Long.parseLong(fact.substring(at + 1, eq));
		this.value = fact.substring(eq + 1, fact.length());
	}

	public String toFact() {
		return owner + "-" + item + "-" + property + "@" + timestamp + "=" + value;
	}

	@Override
	public int compareTo(HiFact other) {
		int diff = Long.valueOf(this.timestamp).compareTo(other.timestamp);
		if (diff != 0) {
			return diff;
		} else {
			diff = this.owner.compareTo(other.owner);
			if (diff != 0) {
				return diff;
			} else {
				diff = this.item.compareTo(other.item);
				if (diff != 0) {
					return diff;
				} else {
					diff = this.property.compareTo(other.property);
					if (diff != 0) {
						return diff;
					} else {
						return this.value.compareTo(other.value);
					}
				}
			}
		}
	}
}
